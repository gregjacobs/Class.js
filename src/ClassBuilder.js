/*global Class, Util */

// A regular expression which is used to determine if a method calls its superclass method (using this._super())
var superclassMethodCallRegex = /xyz/.test( function(){ var a = "xyz"; } ) ? /\b_super\b/ : /.*/;  // a regex to see if the _super() method is called within a function, for JS implementations that allow a function's text to be converted to a string. Note, need to keep the "xyz" as a string, so minifiers don't re-write it. 


// inline override() function which is attached to subclass constructor functions
var inlineOverride = function( obj ) {
	for( var p in obj ) {
		this[ p ] = obj[ p ];
	}
};


/**
 * @private
 * @class Class.ClassBuilder
 * @singleton
 * 
 * Performs the functionality of building a class. Used from {@link Class#extend}.
 */
var ClassBuilder = {
	
	/**
	 * Builds a class from the `superclass` and `overrides` for the subclass.
	 * 
	 * @param {Function} superclass The constructor function of the class being extended. 
	 * @param {Object} overrides An object literal with members that make up the subclass's properties/method.
	 * @return {Function} The subclass constructor from the `overrides` parameter, or a generated one if not provided.
	 */
	build : function( superclass, overrides ) {
		// Grab any special properties from the overrides, and then delete them (except for `abstractClasss`) so that they 
		// aren't applied to the subclass's prototype when we copy all of the 'overrides' properties there
		var abstractClass = !!overrides.abstractClass,
		    statics = overrides.statics,
		    inheritedStatics = overrides.inheritedStatics,
		    mixins = overrides.mixins;
		
		delete overrides.statics;
		delete overrides.inheritedStatics;
		delete overrides.mixins;
		
		// --------------------------
		
		// Before creating the new subclass pre-process the methods of the subclass (defined in "overrides") to add the 
		// this._super() method for methods that can call their associated superclass method. This should happen before 
		// defining the new subclass, so that the constructor function can be wrapped as well.
		ClassBuilder.wrapSuperclassCallingMethods( superclass, overrides );
		
		// --------------------------
		
		
		// Now that preprocessing is complete, define the new subclass's constructor *implementation* function. 
		// This is going to be wrapped in the actual subclass's constructor
		// This will be the actual implementation of the subclass's constructor (which the user defines), or a default
		// constructor which simply calls the superclass's constructor.
		var subclassCtorImplFn = ClassBuilder.createConstructor( superclass, overrides );
		
		
		// Create the actual subclass's constructor, which tests to see if the class being instantiated is abstract,
		// and if not, calls the subclassCtorFn implementation function
		var subclass = function() {
			var proto = this.constructor.prototype;
			if( proto.hasOwnProperty( 'abstractClass' ) && proto.abstractClass === true ) {
				throw new Error( "Error: Cannot instantiate abstract class" );
			}
			
			// Call the actual constructor's implementation
			return subclassCtorImplFn.apply( this, arguments );
		};
		
		
		ClassBuilder.createPrototypeChain( superclass, subclass );
		ClassBuilder.attachCommonSubclassStatics( subclass );
		ClassBuilder.attachCommonSubclassInstanceMethods( superclass, subclass );
		
		
		// Finally, add the properties/methods defined in the "overrides" config (which is basically the subclass's 
		// properties/methods) onto the subclass prototype now.
		Class.override( subclass, overrides );
		
		
		// -----------------------------------
		
		// Check that if it is a concrete (i.e. non-abstract) class, that all abstract methods have been implemented
		// (i.e. that the concrete class overrides any `Class.abstractMethod` functions from its superclass)
		if( !abstractClass ) {
			ClassBuilder.checkAbstractMethodsImplemented( subclass );
		}
		
		// -----------------------------------
		
		// Now apply inherited statics to the class. Inherited statics from the superclass are first applied,
		// and then all overrides (so that subclasses's inheritableStatics take precedence)
		if( inheritedStatics || superclass.__Class_inheritedStatics ) {
			inheritedStatics = Util.assign( {}, superclass.__Class_inheritedStatics, inheritedStatics );  // inheritedStatics takes precedence of the superclass's inherited statics
			Util.assign( subclass, inheritedStatics );
			subclass.__Class_inheritedStatics = inheritedStatics;  // store the inheritedStatics for the next subclass
		}
		
		// Now apply statics to the class. These statics should override any inheritableStatics for the current subclass.
		// However, the inheritableStatics will still affect subclasses of this subclass.
		if( statics ) {
			Util.assign( subclass, statics );
		}
		
		
		// Handle mixins by applying their methods/properties to the subclass prototype. Methods defined by
		// the class itself will not be overwritten, and the later defined mixins take precedence over earlier
		// defined mixins. (Moving backwards through the mixins array to have the later mixin's methods/properties 
		// take priority)
		if( mixins ) {
			ClassBuilder.applyMixins( subclass, mixins );
		}
		
		
		// If there is a static `onClassCreate` method, call it now with the new subclass as the argument
		var onClassCreate = subclass.onClassCreate || subclass.onClassCreated || subclass.onClassExtended;  // `onClassCreated` and `onClassExtended` are accepted for backward compatibility
		if( onClassCreate ) {
			onClassCreate.call( subclass, subclass );  // call in the scope of `subclass`, and with the `subclass` as the first argument
		}
		
		return subclass;
	},
	
	
	
	/**
	 * @private
	 * @param {Function} superclass
	 * @param {Object} overrides
	 */
	createConstructor : function( superclass, overrides ) {
		var subclassCtorImplFn;
		
		if( overrides.constructor !== Object ) {
			subclassCtorImplFn = overrides.constructor;
			delete overrides.constructor;  // Remove 'constructor' property from overrides here, so we don't accidentally re-apply it to the subclass prototype when we copy all properties over
		} else {
			subclassCtorImplFn = ( superclass === Object ) ? function(){} : function() { return superclass.apply( this, arguments ); };   // create a "default constructor" that automatically calls the superclass's constructor, unless the superclass is Object (in which case we don't need to, as we already have a new object)
		}
		
		return subclassCtorImplFn;
	},
	
	
	/**
	 * @private
	 * @param {Function} superclass
	 * @param {Function} subclass
	 */
	createPrototypeChain : function( superclass, subclass ) {
		var superclassPrototype = superclass.prototype,
		    subclassPrototype = subclass.prototype;
		
		var F = function() {};
		F.prototype = superclassPrototype;
		subclassPrototype = subclass.prototype = new F();  // set up prototype chain
		subclassPrototype.constructor = subclass;          // fix constructor property
		subclass.superclass = subclass.__super__ = superclassPrototype;
		subclass.__Class = true;  // a flag for testing if a given function is a class or not
	},
	
	
	/**
	 * @private
	 * @param {Function} subclass
	 */
	checkAbstractMethodsImplemented : function( subclass ) {
		var subclassPrototype = subclass.prototype;
		
		for( var methodName in subclassPrototype ) {
			if( subclassPrototype[ methodName ] === Class.abstractMethod ) {  // NOTE: Do *not* filter out prototype properties; we want to test them
				if( subclassPrototype.hasOwnProperty( methodName ) ) {
					throw new Error( "The class being created has abstract method '" + methodName + "', but is not declared with 'abstractClass: true'" );
				} else {
					throw new Error( "The concrete subclass being created must implement abstract method: '" + methodName + "', or be declared abstract as well (using 'abstractClass: true')" );
				}
			}
		}
	},
	
	
	/**
	 * @private
	 * @param {Function} superclass
	 * @param {Object} overrides
	 */
	wrapSuperclassCallingMethods : function( superclass, overrides ) {
		var superclassPrototype = superclass.prototype;
		
		// Wrap all methods that use this._super() in the function that will allow this behavior (defined above), except
		// for the special 'constructor' property, which needs to be handled differently for IE (done below).
		for( var prop in overrides ) {
			if( 
			    prop !== 'constructor' &&                               // We process the constructor separately, below (which is needed for IE, because IE8 and probably all versions below it won't enumerate it in a for-in loop, for whatever reason...)
			    overrides.hasOwnProperty( prop ) &&                     // Make sure the property is on the overrides object itself (not a prototype object)
			    typeof overrides[ prop ] === 'function' &&              // Make sure the override property is a function (method)
			    typeof superclassPrototype[ prop ] === 'function' &&    // Make sure the superclass has the same named function (method)
			    !overrides[ prop ].hasOwnProperty( '__Class' ) &&       // We don't want to wrap a constructor function of another class being provided as a prototype property to the class being created
			    superclassMethodCallRegex.test( overrides[ prop ] )     // And check to see if the string "_super" exists within the override function
			) {
				overrides[ prop ] = ClassBuilder.createSuperclassCallingMethod( superclass, prop, overrides[ prop ] );
			}
		}
		
		// Process the constructor on its own, here, because IE8 (and probably all versions below it) will not enumerate it 
		// in the for-in loop above (for whatever reason...)
		if( 
		    overrides.hasOwnProperty( 'constructor' ) &&  // make sure we don't get the constructor property from Object
		    typeof overrides.constructor === 'function' && 
		    typeof superclassPrototype.constructor === 'function' && 
		    superclassMethodCallRegex.test( overrides.constructor )
		) {
			overrides.constructor = ClassBuilder.createSuperclassCallingMethod( superclass, 'constructor', overrides.constructor );
		}
	},
	
	
	/**
	 * @private
	 * @param {Function} subclass
	 */
	attachCommonSubclassStatics : function( subclass ) {
		// Attach new static methods to the subclass
		subclass.override = function( overrides ) { Class.override( subclass, overrides ); };
		subclass.extend = function( overrides ) { return Class.extend( subclass, overrides ); };
		subclass.hasMixin = function( mixin ) { return Class.hasMixin( subclass, mixin ); };
	},
	
	
	/**
	 * Attach new instance methods to the subclass
	 * 
	 * @private
	 * @param {Function} superclass
	 * @param {Function} subclass
	 */
	attachCommonSubclassInstanceMethods : function( superclass, subclass ) {
		var subclassPrototype = subclass.prototype;
		subclassPrototype.superclass = subclassPrototype.supr = function() { return superclass.prototype; };
		subclassPrototype.override = inlineOverride;   // inlineOverride function defined above
		subclassPrototype.hasMixin = function( mixin ) { return Class.hasMixin( this.constructor, mixin ); };
	},
	
	
	/**
	 * Creates a function that wraps methods of the new subclass that can call their superclass method.
	 * 
	 * @private
	 * @param {Function} superclass
	 * @param {String} fnName
	 * @param {Function} fn
	 */
	createSuperclassCallingMethod : function( superclass, fnName, fn ) {
		var superclassPrototype = superclass.prototype;
		
		return function() {
			var tmpSuper = this._super,  // store any current _super reference, so we can "pop it off the stack" when the method returns
			    scope = this;
			
			// Add the new _super() method that points to the superclass's method
			this._super = function( args ) {  // args is an array (or arguments object) of arguments
				return superclassPrototype[ fnName ].apply( scope, args || [] );
			};
			
			// Now call the target method
			var returnVal = fn.apply( this, arguments );
			
			// And finally, restore the old _super reference, as we leave the stack context
			this._super = tmpSuper;
			
			return returnVal;
		};
	},
	
	
	/**
	 * @private
	 * @param {Function} subclass
	 * @param {Function[]} mixins
	 */
	applyMixins : function( subclass, mixins ) {
		var subclassPrototype = subclass.prototype;
		
		for( var i = mixins.length-1; i >= 0; i-- ) {
			var mixinPrototype = mixins[ i ].prototype;
			for( var prop in mixinPrototype ) {
				// Do not overwrite properties that already exist on the prototype
				if( typeof subclassPrototype[ prop ] === 'undefined' ) {
					subclassPrototype[ prop ] = mixinPrototype[ prop ];
				}
			}
		}
		
		// Store which mixin classes the subclass has. This is used in the hasMixin() method
		subclass.mixins = mixins;
	}
	
};