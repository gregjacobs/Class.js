/*global window, ClassBuilder, Util */

// Utility functions / variables. 

// NOTE: This entire source file is wrapped in a UMD block / factory function when built, 
//       so these are not global.


// A variable, which is incremented, for assigning unique ID's to classes (constructor functions), allowing 
// for caching through lookups on hash maps
var classIdCounter = 0;


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
	 * Creates a new class. Equivalent to calling `Class.extend( Object, { ... } )`.
	 * See {@link #extend} for more details.
	 * 
	 * Example:
	 * 
	 *     var Animal = Class.create( {
	 *         // class definition here
	 *     } );
	 *     
	 * Example with `name` argument (see below):
	 * 
	 *     var Animal = Class.create( 'Animal', {
	 *         // class definition here
	 *     } );
	 * 
	 * @param {String} [name] A name for the class. It is recommended that you provide this, as this is set to the constructor's 
	 *   `displayName` property to assist in debugging (esp. on Firefox), and is also used in error messages for subclasses 
	 *   not implementing abstract methods, orphaned "override" methods, etc. 
	 * @param {Object} classDefinition The class definition. See the `overrides` parameter of {@link #extend}.
	 * @return {Function} The generated class (constructor function).
	 */
	create : function( name, classDefinition ) {
		if( typeof name !== 'string' ) {
			classDefinition = name;
			name = "";
		}
		
		return Class.extend( name, Object, classDefinition );
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
	 * @param {String} [name] A name for the new subclass. It is recommended that you provide this, as this is set to the constructor's 
	 *   `displayName` property to assist in debugging (esp. on Firefox), and is also used in error messages for subclasses 
	 *   not implementing abstract methods, orphaned "override" methods, etc. 
	 * @param {Function} superclass The constructor function of the class being extended. If making a brand new class with no superclass, this may
	 *   either be omitted, or provided as `Object`.
	 * @param {Object} overrides An object literal with members that make up the subclass's properties/method. These are copied into the subclass's
	 *   prototype, and are therefore shared between all instances of the new class. This may contain a special member named
	 *   `constructor`, which is used to define the constructor function of the new subclass. If this property is *not* specified,
	 *   a constructor function is generated and returned which just calls the superclass's constructor, passing on its parameters.
	 *   **It is essential that you call the superclass constructor in any provided constructor.** See example code.
	 * @return {Function} The subclass constructor from the `overrides` parameter, or a generated one if not provided.
	 */
	extend : function( name, superclass, overrides ) {
		var args = Array.prototype.slice.call( arguments );
		
		if( typeof name !== 'string' ) {
			args.unshift( "" );  // `name` arg
		}
		
		// The second argument may be omitted, making Object the superclass
		if( args.length === 2 ) {
			args.splice( 1, 0, Object );
		}
		
		name = args[ 0 ];
		superclass = args[ 1 ];
		overrides = args[ 2 ];
		
		return ClassBuilder.build( name, superclass, overrides );
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
		if( overrides ) {
			var proto = origclass.prototype;
			Util.assign( proto, overrides );
			
			if( Util.isIe() && overrides.hasOwnProperty( 'toString' ) ) {
				proto.toString = overrides.toString;
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
		
		if( !Util.isObject( obj ) ) {
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