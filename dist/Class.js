/*!
 * Class.js
 * Version 0.6.0
 *
 * Copyright(c) 2014 Gregory Jacobs <greg@greg-jacobs.com>
 * MIT Licensed. http://www.opensource.org/licenses/mit-license.php
 *
 * http://www.class-js.com
 */
;( function( root, factory ) {
	if( typeof define === 'function' && define.amd ) {
		define( factory );             // Define as AMD module if an AMD loader is present (ex: RequireJS).
	} else if( typeof exports !== 'undefined' ) {
		module.exports = factory();    // Define as CommonJS module for Node.js, if available.
	} else {
		root.Class = factory();        // Finally, define as a browser global if no module loader.
	}
}( this, function() {

	/*global window */
	
	// Utility functions / variables. 
	
	// NOTE: This entire source file is wrapped in a UMD block / factory function when built, 
	//       so these are not global.
	
	/**
	 * Determines if a value is an object.
	 * 
	 * @private
	 * @param {Mixed} value
	 * @return {Boolean} True if the value is an object, false otherwise.
	 */
	function isObject( value ) {
		return !!value && Object.prototype.toString.call( value ) === '[object Object]';  
	}
	
	
	// For dealing with IE's toString() problem
	var isIE = false;
	if( typeof window !== 'undefined' ) {
		var uA = window.navigator.userAgent.toLowerCase();
		isIE = /msie/.test( uA ) && !( /opera/.test( uA ) );
	}
	
	
	// A variable, which is incremented, for assigning unique ID's to classes (constructor functions), allowing 
	// for caching through lookups on hashmaps
	var classIdCounter = 0;
	
	// A regular expression which is used to determine if a method calls its superclass method (using this._super())
	var superclassMethodCallRegex = /xyz/.test( function(){ var a = "xyz"; } ) ? /\b_super\b/ : /.*/;  // a regex to see if the _super() method is called within a function, for JS implementations that allow a function's text to be converted to a string. Note, need to keep the "xyz" as a string, so minifiers don't re-write it. 
	
	// inline override() function which is attached to subclass constructor functions
	var inlineOverride = function( obj ) {
		for( var p in obj ) {
			this[ p ] = obj[ p ];
		}
	};
	
	
	/**
	 * @class Class
	 * @singleton
	 * 
	 * Simple utility for powerful JavaScript class creation. This provides a number of features for OOP in JavaScript, including:
	 * 
	 * - Single inheritance with subclasses (like Java, C#, etc.)
	 * - Mixin classes
	 * - Static methods, which can optionally be automatically inherited by subclasses
	 * - A static method which is placed on classes that are created, which can be used to determine if the *class* is a subclass of 
	 *   another (unlike the `instanceof` operator, which checks if an *instance* is a subclass of a given class).
	 * - An `instanceOf()` method, which should be used instead of the JavaScript `instanceof` operator, to determine if the instance 
	 *   is an instance of a provided class, superclass, or mixin (the JavaScript `instanceof` operator only covers the first two).
	 * - The ability to add static methods while creating/extending a class, right inside the definition using special properties `statics`
	 *   and `inheritedStatics`. The former only applies properties to the class being created, while the latter applies properties to the
	 *   class being created, and all subclasses which extend it. (Note that the keyword for this had to be `statics`, and not `static`, as 
	 *   `static` is a reserved word in Javascript). 
	 * - A special static method, onClassCreated(), which can be placed in either the `statics` or `inheritedStatics` section, that is
	 *   executed after the class has been extended.
	 * 
	 * Note that this is not the base class of all `Class` classes. It is a utility to create classes, and extend other classes. The
	 * fact that it is not required to be at the top of any inheritance hierarchy means that you may use it to extend classes from
	 * other frameworks and libraries, with all of the features that this implementation provides. 
	 *  
	 * Simple example of creating classes:
	 *     
	 *     var Animal = Class.create( {
	 *         constructor : function( name ) {
	 *             this.name = name;
	 *         },
	 *         
	 *         sayHi : function() {
	 *             alert( "Hi, my name is: " + this.name );
	 *         },
	 *         
	 *         eat : function() {
	 *             alert( this.name + " is eating" );
	 *         }
	 *     } );
	 *     
	 *     
	 *     var Dog = Animal.extend( {
	 *         // Override sayHi method from superclass
	 *         sayHi : function() {
	 *             alert( "Woof! My name is: " + this.name );
	 *         }
	 *     } );
	 *     
	 *     var Cat = Animal.extend( {
	 *         // Override sayHi method from superclass
	 *         sayHi : function() {
	 *             alert( "Meow! My name is: " + this.name );
	 *         }
	 *     } );
	 *     
	 *     
	 *     var dog1 = new Dog( "Lassie" );
	 *     var dog2 = new Dog( "Bolt" );
	 *     var cat = new Cat( "Leonardo Di Fishy" );
	 *     
	 *     dog1.sayHi();  // "Woof! My name is: Lassie"
	 *     dog2.sayHi();  // "Woof! My name is: Bolt"
	 *     cat.sayHi();   // "Meow! My name is: Leonardo Di Fishy"
	 *     
	 *     dog1.eat();  // "Lassie is eating"
	 *     dog2.eat();  // "Bolt is eating"
	 *     cat.eat();   // "Leonardo Di Fishy is eating"
	 */
	var Class = {
	
	
		/**
		 * A function which can be referenced from class definition code to specify an abstract method.
		 * This property (a function) simply throws an error if called, meaning that the method must be overridden 
		 * in a subclass. This allows the function to be used to create interfaces. 
		 * 
		 * This is also a special reference where if an abstract class references this property, a concrete subclass 
		 * must implement the method.
		 * 
		 * Ex:
		 * 
		 *     var AbstractClass = Class.create( {
		 *         abstractClass: true,
		 *         
		 *         myMethod : Class.abstractMethod
		 *     } );
		 *     
		 *     var SubClass = AbstractClass.extend( {
		 *         myMethod : function() {   // if this implementation method was missing, code would throw an error
		 *             ...
		 *         }
		 *     } );
		 * 
		 * @property {Function} abstractMethod
		 */
		abstractMethod : function() {
			throw new Error( "method must be implemented in subclass" );
		},
		
		
		/**
		 * Private utility method used to copy all the properties of `config` to `obj`. A third arguments for a "defaults"
		 * object may also be provided.
		 *
		 * @private
		 * @param {Object} obj The receiver of the properties
		 * @param {Object} config The source of the properties
		 * @param {Object} defaults A different object that will also be applied for default values
		 * @return {Object} returns obj
		 */
		assign : function( o, c, defaults ) {
			if( defaults ) {
				Class.assign( o, defaults );  // no "this" reference for friendly out of scope calls
			}
			if( o && c && typeof c === 'object' ) {
				for( var p in c ) {
					o[ p ] = c[ p ];
				}
			}
			return o;
		},
		
		
		/**
		 * Creates a new class. Equivalent to calling `Class.extend( Object, { ... } )`.
		 * See {@link #extend} for more details.
		 * 
		 * Example:
		 * 
		 *     var Animal = Class.create( {
		 *         // class definition here
		 *     } );
		 * 
		 * @param {Object} classDefinition The class definition. See the `overrides` parameter of {@link #extend}.
		 * @return {Function} The generated class (constructor function).
		 */
		create : function( classDefinition ) {
			return Class.extend( Object, classDefinition );
		},
		
		
		/**
		 * Extends one class to create a subclass of it based on a passed object literal (`overrides`), and optionally any mixin 
		 * classes that are desired.
		 * 
		 * This method adds a few methods to the class that it creates:
		 * 
		 * - override : Method that can be used to override members of the class with a passed object literal. 
		 *   Same as {@link #override}, without the first argument.
		 * - extend : Method that can be used to directly extend the class. Same as this method, except without
		 *   the first argument.
		 * - hasMixin : Method that can be used to find out if the class (or any of its superclasses) implement a given mixin. 
		 *   Accepts one argument: the class (constructor function) of the mixin. Note that it is preferable to check if a given 
		 *   object is an instance of another class or has a mixin by using the {@link #isInstanceOf} method. This hasMixin() 
		 *   method will just determine if the class has a given mixin, and not if it is an instance of a superclass, or even an 
		 *   instance of itself.
		 * 
		 * 
		 * For example, to create a subclass of MySuperclass:
		 * 
		 *     MyComponent = Class.extend( MySuperclass, {
		 *         
		 *         constructor : function( config ) {
		 *             // Call superclass constructor
		 *             MyComponent.superclass.constructor.call( this, config );
		 *             
		 *             // Your postprocessing here
		 *         },
		 *     
		 *         // extension of another method (assuming MySuperclass had this method)
		 *         someMethod : function() {
		 *             // some preprocessing, if needed
		 *         
		 *             MyComponent.superclass.someMethod.apply( this, arguments );  // send all arguments to superclass method
		 *             
		 *             // some post processing, if needed
		 *         },
		 *     
		 *         // a new method for this subclass (not an extended method)
		 *         yourMethod: function() {
		 *             // implementation
		 *         }
		 *     } );
		 *
		 * This is an example of creating a class with a mixin called MyMixin:
		 * 
		 *     MyComponent = Class.extend( Class.util.Observable, {
		 *         mixins : [ MyMixin ],
		 *         
		 *         constructor : function( config ) {
		 *             // Call superclass constructor
		 *             MyComponent.superclass.constructor.call( this, config );
		 *             
		 *             // Call the mixin's constructor
		 *             MyMixin.constructor.call( this );
		 *             
		 *             // Your postprocessing here
		 *         },
		 *         
		 *         
		 *         // properties/methods of the mixin will be added automatically, if they don't exist already on the class
		 *         
		 *         
		 *         // method that overrides or extends a mixin's method
		 *         mixinMethod : function() {
		 *             // call the mixin's method, if desired
		 *             MyMixin.prototype.mixinMethod.call( this );
		 *             
		 *             // post processing
		 *         }
		 *         
		 *     } );
		 * 
		 * Note that calling superclass methods can be done with either the [Class].superclass or [Class].__super__ property.
		 *
		 * @param {Function} superclass The constructor function of the class being extended. If making a brand new class with no superclass, this may
		 *   either be omitted, or provided as `Object`.
		 * @param {Object} overrides An object literal with members that make up the subclass's properties/method. These are copied into the subclass's
		 *   prototype, and are therefore shared between all instances of the new class. This may contain a special member named
		 *   `constructor`, which is used to define the constructor function of the new subclass. If this property is *not* specified,
		 *   a constructor function is generated and returned which just calls the superclass's constructor, passing on its parameters.
		 *   **It is essential that you call the superclass constructor in any provided constructor.** See example code.
		 * @return {Function} The subclass constructor from the `overrides` parameter, or a generated one if not provided.
		 */
		extend : function( superclass, overrides ) {	
			// The first argument may be omitted, making Object the superclass
			if( arguments.length === 1 ) {
				overrides = superclass;
				superclass = Object;
			}
			
			
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
			Class.wrapSuperclassCallingMethods( superclass, overrides );
			
			// --------------------------
			
			
			// Now that preprocessing is complete, define the new subclass's constructor *implementation* function. 
			// This is going to be wrapped in the actual subclass's constructor
			// This will be the actual implementation of the subclass's constructor (which the user defines), or a default
			// constructor which simply calls the superclass's constructor.
			var subclassCtorImplFn = Class.createConstructor( superclass, overrides );
			
			
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
			
			
			Class.createPrototypeChain( superclass, subclass );
			Class.attachCommonSubclassStatics( subclass );
			Class.attachCommonSubclassInstanceMethods( superclass, subclass );
			
			
			// Finally, add the properties/methods defined in the "overrides" config (which is basically the subclass's 
			// properties/methods) onto the subclass prototype now.
			Class.override( subclass, overrides );
			
			
			// -----------------------------------
			
			// Check that if it is a concrete (i.e. non-abstract) class, that all abstract methods have been implemented
			// (i.e. that the concrete class overrides any `Class.abstractMethod` functions from its superclass)
			if( !abstractClass ) {
				Class.checkAbstractMethodsImplemented( subclass );
			}
			
			// -----------------------------------
			
			// Now apply inherited statics to the class. Inherited statics from the superclass are first applied,
			// and then all overrides (so that subclasses's inheritableStatics take precedence)
			if( inheritedStatics || superclass.__Class_inheritedStatics ) {
				inheritedStatics = Class.assign( {}, inheritedStatics, superclass.__Class_inheritedStatics );  // inheritedStatics takes precedence of the superclass's inherited statics
				Class.assign( subclass, inheritedStatics );
				subclass.__Class_inheritedStatics = inheritedStatics;  // store the inheritedStatics for the next subclass
			}
			
			// Now apply statics to the class. These statics should override any inheritableStatics for the current subclass.
			// However, the inheritableStatics will still affect subclasses of this subclass.
			if( statics ) {
				Class.assign( subclass, statics );
			}
			
			
			// Handle mixins by applying their methods/properties to the subclass prototype. Methods defined by
			// the class itself will not be overwritten, and the later defined mixins take precedence over earlier
			// defined mixins. (Moving backwards through the mixins array to have the later mixin's methods/properties 
			// take priority)
			if( mixins ) {
				Class.applyMixins( subclass, mixins );
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
					overrides[ prop ] = Class.createSuperclassCallingMethod( superclass, prop, overrides[ prop ] );
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
				overrides.constructor = Class.createSuperclassCallingMethod( superclass, 'constructor', overrides.constructor );
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
		},
		
	
		/**
		 * Adds a list of functions to the prototype of an existing class, overwriting any existing methods with the same name.
		 * Usage:
		 * 
		 *     Class.override( MyClass, {
		 *         newMethod1 : function() {
		 *             // etc.
		 *         },
		 *         newMethod2 : function( foo ) {
		 *             // etc.
		 *         }
		 *     } );
		 * 
		 * @param {Object} origclass The class to override
		 * @param {Object} overrides The list of functions to add to origClass.  This should be specified as an object literal
		 * containing one or more methods.
		 */
		override : function( origclass, overrides ) {
			if( overrides ){
				var p = origclass.prototype;
				Class.assign( p, overrides );
				if( isIE && overrides.hasOwnProperty( 'toString' ) ) {
					p.toString = overrides.toString;
				}
			}
		},
		
	
	
		/**
		 * Determines if a given object (`obj`) is an instance of a given class (`jsClass`). This method will
		 * return true if the `obj` is an instance of the `jsClass` itself, if it is a subclass of the `jsClass`,
		 * or if the `jsClass` is a mixin on the `obj`. For more information about classes and mixins, see the
		 * {@link #extend} method.
		 * 
		 * @param {Mixed} obj The object (instance) to test.
		 * @param {Function} jsClass The class (constructor function) of which to see if the `obj` is an instance of, or has a mixin of.
		 * @return {Boolean} True if the obj is an instance of the jsClass (it is a direct instance of it, 
		 *   it inherits from it, or the jsClass is a mixin of it)
		 */
		isInstanceOf : function( obj, jsClass ) {
			if( typeof jsClass !== 'function' ) {
				throw new Error( "jsClass argument of isInstanceOf method expected a Function (constructor function) for a JavaScript class" );
			}
			
			if( !isObject( obj ) ) {
				return false;
			} else if( obj instanceof jsClass ) {
				return true;
			} else if( Class.hasMixin( obj.constructor, jsClass ) ) {
				return true;
			} else {
				return false;
			}
		},
		
		
		/**
		 * Determines if a class (i.e. constructor function) is, or is a subclass of, the given `baseClass`.
		 * 
		 * The order of the arguments follows how {@link #isInstanceOf} accepts them (as well as the JavaScript
		 * `instanceof` operator. Try reading it as if there was a `subclassof` operator, i.e. `subcls subclassof supercls`.
		 * 
		 * Example:
		 *     var Superclass = Class.create( {} );
		 *     var Subclass = Superclass.extend( {} );
		 *     
		 *     Class.isSubclassOf( Subclass, Superclass );   // true - Subclass is derived from (i.e. extends) Superclass
		 *     Class.isSubclassOf( Superclass, Superclass ); // true - Superclass is the same class as itself
		 *     Class.isSubclassOf( Subclass, Subclass );     // true - Subclass is the same class as itself
		 *     Class.isSubclassOf( Superclass, Subclass );   // false - Superclass is *not* derived from Subclass
		 * 
		 * @param {Function} subclass The class to test.
		 * @param {Function} superclass The class to test against.
		 * @return {Boolean} True if the `subclass` is derived from `superclass` (or is equal to `superclass`), false otherwise.
		 */
		isSubclassOf : function( subclass, superclass ) {
			if( typeof subclass !== 'function' || typeof superclass !== 'function' ) {
				return false;
				
			} else if( subclass === superclass ) {
				// `subclass` is `superclass`, return true 
				return true;
				
			} else {
				// Walk the prototype chain of `subclass`, looking for `superclass`
				var currentClass = subclass,
				    currentClassProto = currentClass.prototype;
				
				while( ( currentClass = ( currentClassProto = currentClass.__super__ ) && currentClassProto.constructor ) ) {  // extra set of parens to get JSLint to stop complaining about an assignment inside a while expression
					if( currentClassProto.constructor === superclass ) {
						return true;
					}
				}
			}
			
			return false;
		},
		
		
		
		/**
		 * Determines if a class has a given mixin. Note: Most likely, you will want to use {@link #isInstanceOf} instead,
		 * as that will tell you if the given class either extends another class, or either has, or extends a class with
		 * a given mixin.
		 * 
		 * @param {Function} classToTest
		 * @param {Function} mixinClass
		 * @return {Boolean}
		 */
		hasMixin : function( classToTest, mixinClass ) {
			// Assign the mixinClass (the class we're looking for as a mixin) an ID if it doesn't yet have one. This is done
			// here (instead of in extend()) so that any class can be used as a mixin, not just ones extended from Class.js)
			var mixinClassId = mixinClass.__Class_classId;
			if( !mixinClassId ) {
				mixinClassId = mixinClass.__Class_classId = ++classIdCounter;  // classIdCounter is from outer anonymous function of this class, and is used to assign a unique ID
			}
			
			// Create a cache for quick re-lookups of the mixin on this class
			var hasMixinCache = classToTest.__Class_hasMixinCache;
			if( !hasMixinCache ) {
				hasMixinCache = classToTest.__Class_hasMixinCache = {};
			}
			
			// If we have the results of a call to this method for this mixin already, returned the cached result
			if( mixinClassId in hasMixinCache ) {
				return hasMixinCache[ mixinClassId ];
			
			} else {
				// No cached result from a previous call to this method for the mixin, do the lookup
				var mixins = classToTest.mixins,
				    superclass = ( classToTest.superclass || classToTest.__super__ );
				
				// Look for the mixin on the classToTest, if it has any
				if( mixins ) {
					for( var i = 0, len = mixins.length; i < len; i++ ) {
						if( mixins[ i ] === mixinClass ) {
							return ( hasMixinCache[ mixinClassId ] = true );  // mixin was found, cache the result and return
						}
					}
				}
				
				// mixin wasn't found on the classToTest, check its superclass for the mixin (if it has one)
				if( superclass && superclass.constructor && superclass.constructor !== Object ) {
					var returnValue = Class.hasMixin( superclass.constructor, mixinClass );
					return ( hasMixinCache[ mixinClassId ] = returnValue );  // cache the result from the call to its superclass, and return that value
					
				} else {
					// mixin wasn't found, and the class has no superclass, cache the result and return false
					return ( hasMixinCache[ mixinClassId ] = false );
				}
			}
		}
		
	};

	return Class;

} ) );