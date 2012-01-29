/*!
 * Class.js
 * Copyright(c) 2012 Gregory Jacobs.
 * MIT Licensed. http://www.opensource.org/licenses/mit-license.php
 * 
 * https://github.com/gregjacobs/Class.js
 */
/**
 * @class Class
 * 
 * Utility for powerful JavaScript class creation. This provides a number of features for OOP in JavaScript, including:
 * 
 * - Single inheritance with subclasses (like Java, C#, etc.)
 * - Mixin classes
 * - Static methods, which can optionally be automatically inherited by subclasses
 * - A static method which is placed on classes that are created, which can be used to determine if the *class* is a subclass of 
 *   another (unlike the `instanceof` operator, which checks if an *instance* is a subclass of a given class).
 * - An `instanceOf()` method, which should be used instead of the JavaScript `instanceof` operator, to determine if the instance 
 *   is an instance of a provided class, superclass, or mixin (the JavaScript `instanceof` operator only covers the first two).
 * 
 * Note that this is not the base class of all `Class` classes. It is a utility to create classes, and extend other classes. The
 * fact that it is not required to be at the top of any inheritance hierarchy means that you may use it to extend classes from
 * other frameworks and libraries, with all of the features that this implementation provides. 
 * 
 * This project is located at: https://github.com/gregjacobs/Class.js
 */
/*global window */
/*jslint forin:true */
var Class = (function() {
	
	// Utility functions / variables
	
	/**
	 * Determines if a value is an object.
	 * 
	 * @private
	 * @static
	 * @method isObject
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
	
	
	// ----------------------------------------
	
	
	/**
	 * @constructor
	 */
	var Class = function() {
		
	};
	
	
	/**
	 * Copies all the properties of `config` to `obj`.
	 *
	 * @static
	 * @method apply
	 * @param {Object} obj The receiver of the properties
	 * @param {Object} config The source of the properties
	 * @param {Object} defaults A different object that will also be applied for default values
	 * @return {Object} returns obj
	 */
	Class.apply = function( o, c, defaults ) {
		if( defaults ) {
			Class.apply( o, defaults );  // no "this" reference for friendly out of scope calls
		}
		if( o && c && typeof c == 'object' ) {
			for( var p in c ) {
				o[ p ] = c[ p ];
			}
		}
		return o;
	};
	
	
	/**
	 * Copies all the properties of config to obj if they don't already exist.
	 *
	 * @static
	 * @method applyIf
	 * @param {Object} obj The receiver of the properties
	 * @param {Object} config The source of the properties
	 * @return {Object} returns obj
	 */
	Class.applyIf = function( o, c ) {
		if( o ) {
			for( var p in c ) {
				if( typeof o[ p ] === 'undefined' ) {
					o[ p ] = c[ p ];
				}
			}
		}
		return o;
	};
		
		
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
	 *             // apply the properties of the config object to this instance
	 *             Class.apply( this, config );
	 *             
	 *             // Call superclass constructor
	 *             MyComponent.superclass.constructor.call( this );
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
	 *             // apply the properties of the config to the object
	 *             Class.apply( this, config );
	 *             
	 *             // Call superclass constructor
	 *             MyComponent.superclass.constructor.call( this );
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
	 * @static
	 * @method extend
	 * @param {Function} superclass The constructor function of the class being extended. If making a brand new class with no superclass, this may
	 *   either be omitted, or provided as `Object`.
	 * @param {Object} overrides <p>An object literal with members that make up the subclass's properties/method. These are copied into the subclass's
	 *   prototype, and are therefore shared between all instances of the new class.</p> <p>This may contain a special member named
	 *   `<b>constructor</b>`, which is used to define the constructor function of the new subclass. If this property is <i>not</i> specified,
	 *   a constructor function is generated and returned which just calls the superclass's constructor, passing on its parameters.</p>
	 *   <p><b>It is essential that you call the superclass constructor in any provided constructor. See example code.</b></p>
	 * @return {Function} The subclass constructor from the `overrides` parameter, or a generated one if not provided.
	 */
	Class.extend = (function() {
		// Set up some private vars that will be used with the extend() method
		var objectConstructor = Object.prototype.constructor;
		
		// inline override function
		var inlineOverride = function( o ) {
			for( var m in o ) {
				this[ m ] = o[ m ];
			}
		};
	
		// extend() method itself
		return function( superclass, overrides ) {
			// The first argument may be omitted, making Object the superclass
			if( arguments.length === 1 ) {
				overrides = superclass;
				superclass = Object;
			}
			
			// Grab any special properties from the overrides
			var statics = overrides.statics,
			    inheritedStatics = overrides.inheritedStatics,
			    mixins = overrides.mixins;
			
			delete overrides.statics;
			delete overrides.inheritedStatics;
			delete overrides.mixins;
			
			
			var subclass = overrides.constructor !== objectConstructor ? overrides.constructor : function() { superclass.apply( this, arguments ); },
			    F = function(){},
			    subclassPrototype,
			    superclassPrototype = superclass.prototype;
			
			F.prototype = superclassPrototype;
			subclassPrototype = subclass.prototype = new F();  // set up prototype chain
			subclassPrototype.constructor = subclass;          // fix constructor property
			subclass.superclass = subclass.__super__ = superclassPrototype;
			
			// If the superclass is Object, set its constructor property to itself (`Function`, which is what the real superclass is now)
			if( superclassPrototype.constructor === objectConstructor ) {
				superclassPrototype.constructor = superclass;
			}
			
			// Attach new static methods to the subclass
			subclass.override = function( overrides ) { Class.override( subclass, overrides ); };
			subclass.extend = function( overrides ) { return Class.extend( subclass, overrides ); };
			subclass.hasMixin = function( mixin ) { return Class.hasMixin( subclass, mixin ); };
			
			// Attach new instance methods to the subclass
			subclassPrototype.superclass = subclassPrototype.supr = function() { return superclassPrototype; };
			subclassPrototype.override = inlineOverride;   // inlineOverride function defined above
			subclassPrototype.hasMixin = function( mixin ) { return Class.hasMixin( this.constructor, mixin ); };   // inlineOverride function defined above
			
			// Finally, add the properties/methods defined in the "overrides" config (which is basically the subclass's 
			// properties/methods) onto the subclass prototype now
			Class.override( subclass, overrides );
			
			
			// Expose the constructor property on the class itself (as opposed to only on its prototype, which is normally only
			// available to instances of the class)
			subclass.constructor = subclassPrototype.constructor;
			
			
			// -----------------------------------
			
			// Now apply inherited statics to the class. Inherited statics from the superclass are first applied,
			// and then all overrides (so that subclasses's inheritableStatics take precedence)
			if( inheritedStatics || superclass.__Class_inheritedStatics ) {
				inheritedStatics = Class.apply( {}, inheritedStatics, superclass.__Class_inheritedStatics );  // inheritedStatics takes precedence of the superclass's inherited statics
				Class.apply( subclass, inheritedStatics );
				subclass.__Class_inheritedStatics = inheritedStatics;  // store the inheritedStatics for the next subclass
			}
			
			// Now apply statics to the class. These statics should override any inheritableStatics for the current subclass.
			// However, the inheritableStatics will still affect subclasses of this subclass.
			if( statics ) {
				Class.apply( subclass, statics );
			}
			
			
			// Handle mixins by applying their methods/properties to the subclass prototype. Methods defined by
			// the class itself will not be overwritten, and the later defined mixins take precedence over earlier
			// defined mixins. (Moving backwards through the mixins array to have the later mixin's methods/properties take priority)
			if( mixins ) {
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
			
			return subclass;
		};
	} )();
	

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
	 * @static
	 * @method override
	 * @param {Object} origclass The class to override
	 * @param {Object} overrides The list of functions to add to origClass.  This should be specified as an object literal
	 * containing one or more methods.
	 */
	Class.override = function( origclass, overrides ) {
		if( overrides ){
			var p = origclass.prototype;
			Class.apply( p, overrides );
			if( isIE && overrides.hasOwnProperty( 'toString' ) ) {
				p.toString = overrides.toString;
			}
		}
	};
	


	/**
	 * Determines if a given object (`obj`) is an instance of a given class (`jsClass`). This method will
	 * return true if the `obj` is an instance of the `jsClass` itself, if it is a subclass of the `jsClass`,
	 * or if the `jsClass` is a mixin on the `obj`. For more information about classes and mixins, see the
	 * {@link #extend} method.
	 * 
	 * @static
	 * @method isInstanceOf
	 * @param {Mixed} obj The object (instance) to test.
	 * @param {Function} jsClass The class (constructor function) of which to see if the `obj` is an instance of, or has a mixin of.
	 * @return {Boolean} True if the obj is an instance of the jsClass (it is a direct instance of it, 
	 *   it inherits from it, or the jsClass is a mixin of it)
	 */
	Class.isInstanceOf = function( obj, jsClass ) {
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
	};
	
	
	
	/**
	 * Determines if a class has a given mixin. Note: Most likely, you will want to use {@link #isInstanceOf} instead,
	 * as that will tell you if the given class either extends another class, or either has, or extends a class with
	 * a given mixin.
	 * 
	 * @static
	 * @method hasMixin
	 * @param {Function} classToTest
	 * @param {Function} mixinClass
	 */
	Class.hasMixin = function( classToTest, mixinClass ) {
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
	};
	
	
	return Class;
	
} )();

