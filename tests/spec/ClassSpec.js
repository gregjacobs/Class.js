/*global jQuery, Class, _, describe, beforeEach, afterEach, it, expect */
/*jslint evil:true */
describe( "Class", function() {
	
	describe( 'apply() utility method', function() {
		
		it( "should copy properties from the second object to the first", function() {
			var obj = Class.apply( {}, {
				foo: 1,
				bar: 2
			} );
			expect( obj ).toEqual( { foo: 1, bar: 2 } );
		} );
		
		
		it( "should mutate the object provided as the first argument", function() {
			var obj = {};
			Class.apply(obj, {
				opt1: 'x',
				opt2: 'y'
			});
			expect( obj ).toEqual( { opt1: 'x', opt2: 'y' } );
		} );
		
		
		it( "should overwrite properties in the first object that exist in the second object with the same name", function() {
			var obj = Class.apply({
				foo: 1,
				baz: 4
			}, {
				foo: 2,
				bar: 3
			});
			expect( obj ).toEqual( { foo: 2, bar: 3, baz: 4 } );
		} );
		
		
		it( "should apply defaults from the 3rd object where the destination property doesn't exist", function() {
			var obj = {};
			Class.apply(obj, {
				foo: 'new',
				exist: true
			}, {
				foo: 'old',
				def: true
			});
			
			expect( obj ).toEqual( { foo: 'new', exist: true, def: true } );
		} );
		
		
		it( "should not overwrite source properties with 'defaults' properties", function() {
			var obj = Class.apply({}, {
				foo: 'foo',
				bar: 'bar'
			}, {
				foo: 'oldFoo',
				bar: 'oldBar'
			});
			expect( obj ).toEqual( { foo: 'foo', bar: 'bar' } );
		} );
		
		
		it( "should return `null` if `null` is provided as the first arg", function() {
			expect( Class.apply(null, {}) ).toBe( null );
		} );
		
	} );
	
	
	describe( 'create()', function() {
		
		it( "should create a new class", function() {
			var constructorCalled = false,
			    methodCalled = false;
			
			var MyClass = Class.create( {
				constructor : function() { constructorCalled = true; },
				method : function() { methodCalled = true; }
			} );
			
			var instance = new MyClass();
			expect( constructorCalled ).toBe( true );  // orig YUI Test err msg: "The constructor should have been called by instantiating the class"
			expect( instance.method ).toBe( MyClass.prototype.method );  // orig YUI Test err msg: "The method should exist on the prototype"
			
			instance.method();
			expect( methodCalled ).toBe( true );  // orig YUI Test err msg: "The method should have been called from the prototype"
		} );
		
	} );
	
	
	describe( 'extend()', function() {
		
		describe( "Test basic extend() functionality (prototype inheritance, constructor reference fixing, superclass reference", function() {
			
			it( "extend() should set up prototype-chained inheritance", function() {
				var Animal = Class.create( {
					constructor: function( name ) {
						this._name = name;
					},
					
					getName : function() {
						return this._name;
					}
				});
				
				var Cat = Class.extend( Animal, {
					constructor: function() {
						this._super( arguments );
						this._willMeow = true;
					},
					
					willMeow : function() {
						return this._willMeow;
					}
				});
				
				var kitty = new Cat( 'Trevor' );
				expect( kitty.getName() ).toEqual( 'Trevor' );  // orig YUI Test err msg: "The kitty has the wrong name!"
				expect( kitty.willMeow() ).toBe( true );  // orig YUI Test err msg: "The kitty won't meow!"
			} );
			
			
			it( "extend() should not require the first argument, defaulting the first arg to Object (which makes the actual superclass `Function`)", function() {
				var A = Class.extend( {} );
				expect( Function ).toBe( A.prototype.superclass.constructor );  // orig YUI Test err msg: "The subclass should have had Function as its superclass (which is what happens when the first arg is `Object`)"
			} );
			
			
			it( "extend() should add static 'superclass' property to a subclass (constructor function) that refers to its superclass prototype", function() {
				var A = Class.extend( Object, {} );
				var B = Class.extend( A, {} );
				expect( A.prototype ).toBe( B.superclass );  // orig YUI Test err msg: "static 'superclass' property not added to constructor function that refers to constructor function"
			} );
			
			
			it( "extend() should add a static `extend` method to the subclass, which can be used to extend it", function() {
				var MyClass = Class.extend( {
					method : function() {}
				} );
				
				var MySubClass = MyClass.extend( {} );
				var instance = new MySubClass();
				
				expect( _.isFunction( instance.method ) ).toBe( true );  // orig YUI Test err msg: "The method should have been inherited to the subclass with the static `extend()` method placed on the superclass constructor"
			} );
			
			
			it( "extend() should allow the constructor of a class that extends from Object to call its superclass constructor", function() {
				var MyClass = Class.extend( Object, {
					constructor : function() {
						this._super();
					}
				} );
			} );
			
			
			it( "extend() should call the constructor implementation in the correct scope for both user-defined constructors, and default constructors", function() {
				var superclassMethodCallCount = 0;
				
				var MyClass = Class.extend( {
					constructor : function() {
						this.superclassMethod();
					},
					
					superclassMethod : function() {
						superclassMethodCallCount++;
					}
				} );
				var MySubclass = MyClass.extend( {
					constructor : function() {
						this._super( arguments );
						this.superclassMethod();
					}
				} );
				
				var instance = new MySubclass();
				expect( superclassMethodCallCount ).toBe( 2 );  // orig YUI Test err msg: "The superclassMethod should have been called exactly twice: once from each class's constructor"
				
				
				// Reset the count and try with a class with a default constructor
				superclassMethodCallCount = 0;
				var MySubSubclass = MySubclass.extend( {
					// This subclass tests the default constructor
				} );
				instance = new MySubSubclass();
				expect( superclassMethodCallCount ).toBe( 2 );  // orig YUI Test err msg: "The superclassMethod should have been called exactly twice: once from each superclass's constructor"
			} );
			
			
			it( "extend() should fix the constructor property on the prototype to point back to its actual constructor, when no user-defined constructor is declared", function() {
				var MyClass = Class.create( {} );
				var MySubClass = MyClass.extend( {} );
				
				var myClassInstance = new MyClass();
				var mySubClassInstance = new MySubClass();
				
				expect( myClassInstance.constructor ).toBe( MyClass );  // orig YUI Test err msg: "The base class should have its constructor prototype property set to its constructor"
				expect( mySubClassInstance.constructor ).toBe( MySubClass );  // orig YUI Test err msg: "The subclass should have its constructor prototype property set to its constructor"
			} );
			
			
			it( "extend() should fix the constructor property on the prototype to point back to its actual constructor, when a user-defined constructor is declared", function() {
				var MyClass = Class.create( { constructor: function(){} } );
				var MySubClass = MyClass.extend( { constructor: function(){} } );
				
				var myClassInstance = new MyClass();
				var mySubClassInstance = new MySubClass();
				
				expect( myClassInstance.constructor ).toBe( MyClass );  // orig YUI Test err msg: "The base class should have its constructor prototype property set to its constructor"
				expect( mySubClassInstance.constructor ).toBe( MySubClass );  // orig YUI Test err msg: "The subclass should have its constructor prototype property set to its constructor"
			} );
			
			
			it( "if a constructor returns a different object than its `this` reference, that object should be returned when instantiating the class", function() {
				var MyClass = Class.extend( {
					constructor : function() {
						return { hi: 1 };  // change the object that is returned from the constructor
					}
				} );
				
				var instance = new MyClass();
				expect( instance.hi ).toBe( 1 );  // orig YUI Test err msg: "The subclass constructor should have returned the overriden return object from its superclass constructor"
			} );
			
			
			it( "if no explicit constructor is provided, extend() should set up a constructor which returns the value of its superclass's constructor (in case the constructor changes the object that is created)", function() {
				var MyClass = Class.extend( {
					constructor : function() {
						return { hi: 1 };  // change the object that is returned from the constructor
					}
				} );
				
				var MySubClass = MyClass.extend( {} );
				
				var instance = new MySubClass();
				expect( instance.hi ).toBe( 1 );  // orig YUI Test err msg: "The subclass constructor should have returned the overriden return object from its superclass constructor"
			} );
			
		} );
		
		
		describe( "Test superclass method calling with _super", function() {
			
			it( "extend() should create the this._super() method for subclass constructor functions", function() {
				var superclassConstructorCallCount = 0;
				
				var A = Class.extend( Object, {
					constructor : function() {
						superclassConstructorCallCount++;
					}
				} );
				
				var B = A.extend( {
					constructor : function() {
						this._super( arguments );
					}
				} );
				
				var instance = new B();
				expect( superclassConstructorCallCount ).toBe( 1 );  // orig YUI Test err msg: "The superclass's constructor should have been called (exactly once)"
				
				// As an extra sanity check, make sure the instance is an instance of A and B
				expect( instance instanceof A ).toBe( true );  // orig YUI Test err msg: "The instance should be an instance of class A"
				expect( instance instanceof B ).toBe( true );  // orig YUI Test err msg: "The instance should be an instance of class B"
			} );
			
			
			it( "extend() should create the this._super() method for subclass constructor functions, and be able to pass up the arguments", function() {
				var superclassConstructorArgs;
				    
				var A = Class.extend( Object, {
					constructor : function( a, b, c ) {
						superclassConstructorArgs = arguments;
					}
				} );
				
				var B = A.extend( {
					constructor : function( a, b, c ) {
						this._super( arguments );
					}
				} );
				
				var instance = new B( 1, 2, 3 );
				expect( superclassConstructorArgs.length ).toBe( 3 );  // orig YUI Test err msg: "The 3 arguments should have been passed up to the superclass constructor"
				expect( superclassConstructorArgs[ 0 ] ).toBe( 1 );  // orig YUI Test err msg: "The first arg should be 1"
				expect( superclassConstructorArgs[ 1 ] ).toBe( 2 );  // orig YUI Test err msg: "The second arg should be 2"
				expect( superclassConstructorArgs[ 2 ] ).toBe( 3 );  // orig YUI Test err msg: "The third arg should be 3"
			} );
			
			
			it( "extend() should allow a constructor of a class that is directly inherited from Object to be able to call the superclass constructor", function() {
				var A = Class.extend( Object, {
					constructor : function() {
						this._super();
					}
				} );
				var instance = new A();
				
				// This test should simply not error. this._super() should be defined, and be able to be called just fine
			} );
			
			
			it( "extend() should create the this._super() method for subclass constructor functions, even if the superclass is not defined using Class.extend()", function() {
				var superclassConstructorCallCount = 0;
				var A = function() {
					superclassConstructorCallCount++;
				};
				
				var B = Class.extend( A, {
					constructor : function() {
						this._super();
					}
				} );
				
				var instance = new B();
				expect( superclassConstructorCallCount ).toBe( 1 );  // orig YUI Test err msg: "The superclass's constructor should have been called (exactly once)"
			} );
			
			
			it( "extend() should create the this._super() method for subclass constructor functions, even if the superclass does not explicitly define a constructor", function() {
				var superclassConstructorCallCount = 0;
				
				var A = Class.extend( Object, {} );
				
				var B = A.extend( {
					constructor : function() {
						this._super();
						
						this.myVar = 0;
					}
				} );
				
				var instance = new B();
				// Note: Test should simply not throw an error, but check that B's `myVar` instance variable is set
				expect( instance.myVar ).toBe( 0 );  // orig YUI Test err msg: "B's `myVar` instance variable should have been set"
			} );
			
			
			it( "extend() should create the this._super() method for subclass methods that have a corresponding superclass method", function() {
				var myMethodCallCount = 0;
				
				var A = Class.extend( Object, {
					myMethod : function() {
						myMethodCallCount++;
					}
				} );
				
				var B = A.extend( {
					myMethod : function() {
						this._super();
					}
				} );
				
				var instance = new B();
				instance.myMethod();
				expect( myMethodCallCount ).toBe( 1 );  // orig YUI Test err msg: "The superclass myMethod() should have been called exactly once"
			} );
			
			
			it( "extend() should create the this._super() method for subclass methods that have a corresponding superclass method, and be able to pass up arguments", function() {
				var superclassMethodArgs;
				
				var A = Class.extend( Object, {
					myMethod : function() {
						superclassMethodArgs = arguments;
					}
				} );
				
				var B = A.extend( {
					myMethod : function( a, b, c ) {
						this._super( arguments );
					}
				} );
				
				
				var instance = new B();
				instance.myMethod( 1, 2, 3 );
				expect( superclassMethodArgs.length ).toBe( 3 );  // orig YUI Test err msg: "The 3 arguments should have been passed up to the superclass method"
				expect( superclassMethodArgs[ 0 ] ).toBe( 1 );  // orig YUI Test err msg: "The first arg should be 1"
				expect( superclassMethodArgs[ 1 ] ).toBe( 2 );  // orig YUI Test err msg: "The second arg should be 2"
				expect( superclassMethodArgs[ 2 ] ).toBe( 3 );  // orig YUI Test err msg: "The third arg should be 3"
			} );
			
			
			it( "extend() should create the this._super() method, and return the value from the call to this._super()", function() {
				var A = Class.extend( Object, {
					myMethod : function() {
						return 42;
					}
				} );
				
				var B = A.extend( {
					myMethod : function() {
						return this._super();
					}
				} );
				
				var instance = new B();
				var myMethodResult = instance.myMethod();
				expect( myMethodResult ).toBe( 42 );  // orig YUI Test err msg: "this._super() should have returned the value returned by the superclass method"
			} );
			
			
			it( "extend() should create the this._super() method for subclass methods that have a corresponding superclass method, even if the superclass is not defined using Class.extend()", function() {
				var myMethodCallCount = 0;
				
				var A = function(){};
				A.prototype.myMethod = function() {
					myMethodCallCount++;
				};
				
				var B = Class.extend( A, {
					myMethod : function() {
						this._super();
					}
				} );
				
				var instance = new B();
				instance.myMethod();
				expect( myMethodCallCount ).toBe( 1 );  // orig YUI Test err msg: "The superclass myMethod() should have been called exactly once"
			} );
			
			
			it( "extend() should NOT create the this._super() method for subclass methods that do not have a corresponding superclass method", function() {
				var myMethodCallCount = 0;
				
				var A = Class.extend( Object, {
					// note: no superclass myMethod
				} );
				
				var B = A.extend( {
					myMethod : function() {
						this._super();
					}
				} );
				
				var instance = new B();
				
				try {
					instance.myMethod();  // this line should cause an error to be thrown
					expect( true ).toBe( false );  // orig YUI Test err msg: "The test should have errored, with '_super' is not a function"
					
				} catch( ex ) {
					// Since different browsers throw the error differently, check if the string "_super" is in the error message.
					// If it's not, there might be a different error message
					if( !/\b_super\b/.test( ex.message ) && 
					    !/'undefined' is not a function/.test( ex.message ) && 
					    !/object doesn't support this property or method/i.test( ex.message ) 
					) {
						expect( true ).toBe( false );  // orig YUI Test err msg: "The test threw an error that didn't have to do with the _super() method. The error message is: " + ex.message
					}
				}
			} );
			
			
			it( "extend() should NOT create the this._super() method for subclass methods that do not call _super()", function() {
				var myMethodCallCount = 0;
				
				var A = Class.extend( Object, {
					// note: no superclass myMethod
				} );
				
				var B = A.extend( {
					myMethod : function() {
						// Piece together the "_super" string, to fool the code into thinking that this method
						// does not call its superclass method. However, in real-world code, this wouldn't (or at least 
						// shouldn't!) be done, so real-world code will be fine
						var parentMethod = '_' + 's' + 'u' + 'p' + 'e' + 'r';
						this[ parentMethod ]();
					}
				} );
				
				var instance = new B();
				
				try {
					instance.myMethod();  // this line should cause an error to be thrown
					expect( true ).toBe( false );  // orig YUI Test err msg: "The test should have errored, with '_super' is not a function"
					
				} catch( ex ) {
					// Since different browsers throw the error differently, check if the string "_super" or "parentMethod" (the var that is used) is in 
					// the error message. If it's not, there might be a different error message
					if( !/\bparentMethod\b/.test( ex.message ) && 
					    !/'undefined' is not a function/.test( ex.message ) && 
					    !/\b_super\b/.test( ex.message ) && 
					    !/object doesn't support this property or method/i.test( ex.message )
					) {
						expect( true ).toBe( false );  // orig YUI Test err msg: "The test threw an error that didn't have to do with the _super() method. The error message is: " + ex.message
					}
				}
			} );
			
			
			it( "extend() should *not* wrap the constructor function of another class with the _super() calling method", function() {
				var InnerClass = Class.create( {
					constructor : function() {
						this._super();   // This constructor calls this._super(), but we won't want it wrapped with the this._super() calling function from OuterClass
					}
				} );
				
				var OuterSuperClass = Class.create( {  // a superclass, because 'innerClass' will only be wrapped if the superclass has a property with the same name, and is also a function
					innerClass : function() {}
				} );
				var OuterSubClass = OuterSuperClass.extend( {
					innerClass : InnerClass
				} );
				
				expect( OuterSubClass.prototype.innerClass ).toBe( InnerClass );  // orig YUI Test err msg: "The 'innerClass' on OuterClass's prototype should be the exact InnerClass constructor function reference, not a this._super() wrapping function (or anything else...)"
			} );
			
			
			it( "extend() should *not* wrap the constructor function of another class with the _super() calling method, in JS implementations that do not support reading the function's text", function() {
				// A "class" that will be wrapped by the this._super() calling method. This is to emulate a class created with Class.js on browsers that *do*
				// support reading the function's text. We can't use the actual constructor that Class.js creates, because that does not have the text "_super" in it
				var InnerClass = function() {
					this._super();   // This constructor calls this._super(), but we won't want it wrapped with the this._super() calling function from OuterClass
				};
				InnerClass.__Class = true;  // the flag we're using to determine if a constructor function is a class. No other way to determine...  This is set when the class is created.
				
				var OuterSuperClass = Class.create( {  // a superclass, because 'innerClass' will only be wrapped if the superclass has a property with the same name, and is also a function
					innerClass : function() {}
				} );
				var OuterSubClass = OuterSuperClass.extend( {
					innerClass : InnerClass
				} );
				
				expect( OuterSubClass.prototype.innerClass ).toBe( InnerClass );  // orig YUI Test err msg: "The 'innerClass' on OuterClass's prototype should be the exact InnerClass constructor function reference, not a this._super() wrapping function (or anything else...)"
			} );
			
		} );
		
		
		describe( "Test extend() statics functionality", function() {
			
			it( "extend() should add static properties defined in `statics`", function() {
				var MyClass = Class.extend( Object, {
					statics : {
						staticFn1 : function() {},
						staticFn2 : function() {}
					}
				} );
				
				expect( _.isFunction( MyClass.staticFn1 ) ).toBe( true );
				expect( _.isFunction( MyClass.staticFn2 ) ).toBe( true );
			} );
			
			
			it( "The static properties defined in `statics` should not be inherited to subclasses", function() {
				var MyClass = Class.extend( Object, {
					statics : {
						staticFn : function() {}
					}
				} );
				var MySubClass = MyClass.extend( {} );
				
				expect( _.isFunction( MyClass.staticFn ) ).toBe( true );
				expect( MySubClass.staticFn ).toBeUndefined();
			} );
			
			
			it( "The static methods defined in `statics` should have their `this` reference set to their class when executed", function() {
				var thisReference;
				
				var MyClass = Class.create( {
					statics : {
						staticMethod : function() {
							thisReference = this;
						}
					}
				} );
				
				// Execute the function
				MyClass.staticMethod();
				
				expect( thisReference ).toBe( MyClass );
			} );
			
		} );
		
		
		describe( "Test extend() inheritedStatics functionality", function() {
			
			it( "extend() should add static properties defined in `inheritedStatics`", function() {
				var MyClass = Class.extend( Object, {
					inheritedStatics : {
						staticFn1 : function() {},
						staticFn2 : function() {}
					}
				} );
				
				expect( _.isFunction( MyClass.staticFn1 ) ).toBe( true );
				expect( _.isFunction( MyClass.staticFn2 ) ).toBe( true );
			} );
			
			
			it( "The static properties defined in `inheritedStatics` should be inherited to subclasses", function() {
				var MyClass = Class.extend( Object, {
					inheritedStatics : {
						staticFn : function() {}
					}
				} );
				var MySubClass = MyClass.extend( {} );
				var MySubSubClass = MySubClass.extend( {} );
				var MySubSubSubClass = MySubSubClass.extend( {} );
				
				expect( _.isFunction( MyClass.staticFn ) ).toBe( true );  // orig YUI Test err msg: "The staticFn should exist on the class it was defined on with `inheritedStatics`"
				expect( _.isFunction( MySubClass.staticFn ) ).toBe( true );  // orig YUI Test err msg: "The staticFn should exist on a direct subclass"
				expect( _.isFunction( MySubSubClass.staticFn ) ).toBe( true );  // orig YUI Test err msg: "The staticFn should exist on a subclass 2 subclasses down from the class that defined it"
				expect( _.isFunction( MySubSubSubClass.staticFn ) ).toBe( true );  // orig YUI Test err msg: "The staticFn should exist on a subclass 3 subclasses down from the class that defined it"
			} );
			
			
			it( "The static properties defined in `inheritedStatics` should be inherited to subclasses, but not affect superclasses", function() {
				var MyClass = Class.extend( {} );
				var MySubClass = MyClass.extend( {} );
				var MySubSubClass = MySubClass.extend( {
					inheritedStatics : {
						staticFn : function() {}
					}
				} );
				var MySubSubSubClass = MySubSubClass.extend( {} );
				
				expect( MyClass.staticFn ).toBeUndefined();  // orig YUI Test err msg: "The staticFn should not exist on a far superclass that has a subclass with `inheritableStatics`"
				expect( MySubClass.staticFn ).toBeUndefined();  // orig YUI Test err msg: "The staticFn should not exist on a direct superclass of a subclass with `inheritableStatics`"
				expect( _.isFunction( MySubSubClass.staticFn ) ).toBe( true );  // orig YUI Test err msg: "The staticFn should exist on the subclass that `inheritableStatics` was defined on"
				expect( _.isFunction( MySubSubSubClass.staticFn ) ).toBe( true );  // orig YUI Test err msg: "The staticFn should exist on a subclass of the class that defined `inheritableStatics`"
			} );
			
			
			it( "Redefining an inherited static should take precedence in the subclass over the superclass's static", function() {
				var method = function() {},
				    subclassMethod = function() {};
				
				var MyClass = Class.extend( {
					inheritedStatics : {
						method : method
					}
				} );
				var MySubClass = MyClass.extend( {
					inheritedStatics : {
						method : subclassMethod
					}
				} );
				
				expect( MyClass.method ).toBe( method );  // orig YUI Test err msg: "Initial condition: MyClass should have the original method"
				expect( MySubClass.method ).toBe( subclassMethod );  // orig YUI Test err msg: "MySubClass should have the new method (overriding the superclass static method)"
			} );
			
			
			it( "Overriding an inherited static with a regular (non-inherited) static should only affect the class that the non-inherited static is defined for", function() {
				var inheritedMethod = function() {},
				    overrideStaticMethod = function() {};
				
				var MyClass = Class.extend( {
					inheritedStatics : {
						method : inheritedMethod
					}
				} );
				var MySubClass = MyClass.extend( {
					statics : {
						method : overrideStaticMethod  // Note: A non-inherited static
					}
				} );
				var MySubSubClass = MySubClass.extend( {} );
				
				expect( MyClass.method ).toBe( inheritedMethod );  // orig YUI Test err msg: "Initial condition: MyClass should have the original inheritedMethod"
				expect( MySubClass.method ).toBe( overrideStaticMethod );  // orig YUI Test err msg: "MySubClass should have the new `static` method (overriding the superclass static method)"
				expect( MySubSubClass.method ).toBe( inheritedMethod );  // orig YUI Test err msg: "MySubSubClass should have the original inheritedMethod (the non-inherited `static` method in its superclass should not have affected this behavior)"
			} );
			
			
			it( "The static methods defined in `inheritedStatics` should have their `this` reference set to their class when executed", function() {
				var thisReference;
				
				var MyClass = Class.create( {
					inheritedStatics : {
						staticMethod : function() {
							thisReference = this;
						}
					}
				} );
				var MySubClass = MyClass.extend( {} );
				
				// Execute the method in the superclass
				MyClass.staticMethod();
				expect( thisReference ).toBe( MyClass );
				
				// Now execute the method in the subclass
				MySubClass.staticMethod();
				expect( thisReference ).toBe( MySubClass );
			} );
			
		} );
		
		
		describe( "Test extend() mixin functionality", function() {
			
			it( "extend() should be able to add in a single mixin class into another class", function() {
				var mixinFnExecuted = false; 
				
				var Mixin = Class.extend( Object, {
					mixinFn : function() {
						mixinFnExecuted = true;
					}
				} );
				
				var MyClass = Class.extend( Object, {
					mixins : [ Mixin ]
				} );
				
				
				var instance = new MyClass(); 
				instance.mixinFn();   // execute the function
				expect( mixinFnExecuted ).toBe( true );  // orig YUI Test err msg: "The mixin function was not properly added to MyClass."
			} );
			
			
			it( "extend() should not overwrite a class's methods/properties with a mixin's methods/properties", function() {
				var data = null; 
				
				var Mixin = Class.extend( Object, {
					testProp : "Mixin defined",
					testMethod : function() {
						data = "Mixin defined";
					}
				} );
				
				var MyClass = Class.extend( Object, {
					mixins : [ Mixin ],
					
					testProp : "MyClass defined",
					testMethod : function() {
						data = "MyClass defined";
					}
				} );
				
				
				var instance = new MyClass(); 
				expect( instance.testProp ).toBe( "MyClass defined" );  // orig YUI Test err msg: "The mixin should not overwrite the class's properties"
				
				instance.testMethod();
				expect( data ).toBe( "MyClass defined" );  // orig YUI Test err msg: "The mixin's method should not have overwritten the class's method."
			} );
			
			
			it( "extend() should have later-defined mixins take precedence over earlier-defined mixins", function() {
				var Mixin1 = Class.extend( Object, {
					testProp : "Mixin1 defined"
				} );
				var Mixin2 = Class.extend( Object, {
					testProp : "Mixin2 defined"
				} );
				
				var MyClass = Class.extend( Object, {
					mixins : [ Mixin1, Mixin2 ]
				} );
				
				var instance = new MyClass();
				expect( instance.testProp ).toBe( "Mixin2 defined" );  // orig YUI Test err msg: "The second mixin's properties/methods should take precedence over the first one's."
			} );
			
			
			it( "extend() should have set up the static hasMixin() method, which should check the class for a given mixin", function() {
				var Mixin = Class.extend( Object, {} );
				var SomeOtherMixin = Class.extend( Object, {} );
				
				var MyClass = Class.extend( Object, {	
					mixins : [ Mixin ]
				} );
				
				expect( MyClass.hasMixin( Mixin ) ).toBe( true );  // orig YUI Test err msg: "MyClass should have the mixin 'Mixin'"
				expect( MyClass.hasMixin( SomeOtherMixin ) ).toBe( false );  // orig YUI Test err msg: "MyClass should *not* have the mixin 'SomeOtherMixin'"
			} );
			
			
			it( "extend() should have set up the instance hasMixin() method, which should check an instance for a given mixin", function() {
				var Mixin = Class.extend( Object, {} );
				var SomeOtherMixin = Class.extend( Object, {} );
				
				var MyClass = Class.extend( Object, {	
					mixins : [ Mixin ]
				} );
				var myInstance = new MyClass();
				
				expect( myInstance.hasMixin( Mixin ) ).toBe( true );  // orig YUI Test err msg: "myInstance should have the mixin 'Mixin'"
				expect( myInstance.hasMixin( SomeOtherMixin ) ).toBe( false );  // orig YUI Test err msg: "myInstance should *not* have the mixin 'SomeOtherMixin'"
			} );
			
		} );
		
		
		describe( "Test extend() 'abstractClass' functionality", function() {
			
			it( "A class created with `abstractClass: true` should not be able to be instantiated when declared with no constructor", function() {
				expect( function() {
					var AbstractClass = Class.create( {
						abstractClass: true
					} );
					
					var instance = new AbstractClass();
					expect( true ).toBe( false );  // orig YUI Test err msg: "The test should have thrown an error when attempting to instantiate an abstract class"
				} ).toThrow( "Error: Cannot instantiate abstract class" );
			} );
			
			
			it( "A class created with `abstractClass: true` should not be able to be instantiated when declared with its own constructor", function() {
				expect( function() {
					var AbstractClass = Class.create( {
						abstractClass: true,
						
						// Declare own constructor
						constructor : function() {}
					} );
					
					var instance = new AbstractClass();
					expect( true ).toBe( false );  // orig YUI Test err msg: "The test should have thrown an error when attempting to instantiate an abstract class"
				} ).toThrow( "Error: Cannot instantiate abstract class" );
			} );
			
			
			it( "A subclass of an abstract class (which doesn't define its own constructor) should be able to be instantiated", function() {
				var AbstractClass = Class.create( {
					abstractClass: true
				} );
				var ConcreteClass = AbstractClass.extend( {
					
				} );
				
				var instance = new ConcreteClass();
			} );
			
			
			it( "A subclass of an abstract class (which *does* define its own constructor) should be able to be instantiated", function() {
				var abstractClassConstructorCallCount = 0;
				
				var AbstractClass = Class.create( {
					abstractClass: true,
					
					constructor : function() {
						abstractClassConstructorCallCount++;
					}
				} );
				var ConcreteClass = AbstractClass.extend( {
					
				} );
				
				var instance = new ConcreteClass();
				expect( abstractClassConstructorCallCount ).toBe( 1 );  // orig YUI Test err msg: "The abstract class's constructor should have been called exactly once"
			} );
			
			
			it( "An abstract class's constructor should be able to be executed from the concrete class", function() {
				var abstractClassConstructorCallCount = 0;
				
				var AbstractClass = Class.create( {
					abstractClass : true,
					
					constructor : function() {
						abstractClassConstructorCallCount++;
					}
				} );
				
				var ConcreteClass = AbstractClass.extend( {
					constructor : function() {
						this._super( arguments );
					}
				} );
				
				var instance = new ConcreteClass();
				expect( abstractClassConstructorCallCount ).toBe( 1 );  // orig YUI Test err msg: "The abstract class's constructor should have been called exactly once"
			} );
			
			
			it( "extend() should throw an error for a class with abstract methods that is not declared with abstractClass: true", function() {
				expect( function() {
					var ConcreteClass = Class.create( {
						concreteMethod : function() {},
						abstractMethod : Class.abstractMethod
					} );
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "Test should have thrown an error for a concrete class with an abstract method"
				} ).toThrow( "The class being created has abstract method 'abstractMethod', but is not declared with 'abstractClass: true'" );
			} );
			
			
			it( "extend() should throw an error if a concrete class does not implement all abstract methods from its superclass", function() {
				expect( function() {
					var AbstractClass = Class.create( {
						abstractClass : true,
						
						concreteMethod : function() {},
						abstractMethod1 : Class.abstractMethod,
						abstractMethod2 : Class.abstractMethod
					} );
					
					var ConcreteClass = AbstractClass.extend( {
						// *** Only implement 1 of the 2 abstract methods
						abstractMethod1 : function(){}
					} );
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "Test should have thrown an error for a concrete class with an abstract method (abstractMethod2 not implemented)"
				} ).toThrow( "The concrete subclass being created must implement abstract method: 'abstractMethod2', or be declared abstract as well (using 'abstractClass: true')" );
			} );
			
			
			it( "extend() should allow a properly defined abstract class with abstract methods, and a concrete class with the abstract methods implemented", function() {
				var AbstractClass = Class.create( {
					abstractClass : true,
					
					concreteMethod : function() {},
					abstractMethod1 : Class.abstractMethod,
					abstractMethod2 : Class.abstractMethod
				} );
				
				var ConcreteClass = AbstractClass.extend( {
					// Implement both of the abstract methods
					abstractMethod1 : function(){},
					abstractMethod2 : function(){}
				} );
				
				// This test should simply not error -- both abstract methods have been implemented by ConcreteClass
			} );
			
			
			it( "extend() should allow a hierarchy of properly defined abstract classes with abstract methods, and a concrete class with the abstract methods implemented", function() {
				var AbstractClass = Class.create( {
					abstractClass : true,
					
					concreteMethod : function() {},
					
					// 2 abstract methods
					abstractMethod1 : Class.abstractMethod,
					abstractMethod2 : Class.abstractMethod
				} );
				
				var AbstractSubclass = AbstractClass.extend( {
					abstractClass : true,
					
					// Implement one of the abstract methods
					abstractMethod1 : function() {}
				} );
				
				var ConcreteClass = AbstractSubclass.extend( {
					// Implement the other abstract method
					abstractMethod2 : function(){}
				} );
				
				// This test should simply not error -- abstractMethod1 implemented by AbstractSubclass, and abstractMethod2 implemented by ConcreteClass
			} );
			
		} );
		
		
		describe( "Test extend() onClassExtended", function() {
			
			it( "onClassExtended(), if it exists as a static, should be executed after all other extend functionality has completed", function() {
				var onClassExtendedCallCount = 0;
				
				var MyMixin = Class.create( {
					mixinInstanceMethod : function() {}
				} );
				
				var MyClass = Class.create( {
					statics : {
						onClassExtended : function( newClass ) {
							onClassExtendedCallCount++;
							
							// ASSERTS CONTINUE HERE
							expect( _.isFunction( newClass.someStaticMethod ) ).toBe( true );  // orig YUI Test err msg: "someStaticMethod should exist as a static method by this point"
							expect( _.isFunction( newClass.someInheritedStaticMethod ) ).toBe( true );  // orig YUI Test err msg: "someInheritedStaticMethod should exist as a static method by this point"
							expect( _.isFunction( newClass.prototype.mixinInstanceMethod ) ).toBe( true );  // orig YUI Test err msg: "mixinInstanceMethod should exist as an instance method by this point"
						},
						
						someStaticMethod : function() {}
					},
					
					inheritedStatics : {
						someInheritedStaticMethod : function() {}
					},
					
					mixins : [ MyMixin ]
				} );
				
				expect( onClassExtendedCallCount ).toBe( 1 );  // to make sure the function actually runs
				// NOTE: Asserts continue inside onClassExtended
			} );
			
			
			it( "onClassExtended(), if it exists as an inherited static, should be executed for all subclasses", function() {
				var onClassExtendedCallCount = 0,
				    currentClassPassedIn;
				
				var MyClass = Class.create( {
					inheritedStatics : {
						onClassExtended : function( newClass ) {
							onClassExtendedCallCount++;
							currentClassPassedIn = newClass;
						}
					}
				} );
				
				expect( onClassExtendedCallCount ).toBe( 1 );  // orig YUI Test err msg: "onClassExtended should have been called exactly once at this point"
				expect( currentClassPassedIn ).toBe( MyClass );  // orig YUI Test err msg: "onClassExtended should have been passed the new class"
				
				
				// Now create a subclass, without an explicit onClassExtended function. It should be used from the superclass
				var MySubClass = MyClass.extend( {} );
				
				expect( onClassExtendedCallCount ).toBe( 2 );  // orig YUI Test err msg: "onClassExtended should have been called exactly twice at this point"
				expect( currentClassPassedIn ).toBe( MySubClass );  // orig YUI Test err msg: "onClassExtended should have been passed the new subclass"
			} );
			
		} );
		
	} );
	
	
	describe( "Test isInstanceOf()", function() {
		
		it( "isInstanceOf() should return false for any primitive type", function() {
			expect( Class.isInstanceOf( undefined, Object ) ).toBe( false );  // orig YUI Test err msg: "isInstanceOf should have returned false when given undefined"
			expect( Class.isInstanceOf( null, Object ) ).toBe( false );  // orig YUI Test err msg: "isInstanceOf should have returned false when given null"
			expect( Class.isInstanceOf( 1, Object ) ).toBe( false );  // orig YUI Test err msg: "isInstanceOf should have returned false when given a number"
			expect( Class.isInstanceOf( "hi", Object ) ).toBe( false );  // orig YUI Test err msg: "isInstanceOf should have returned false when given a string"
			expect( Class.isInstanceOf( true, Object ) ).toBe( false );  // orig YUI Test err msg: "isInstanceOf should have returned false when given a boolean"
		} );
		
		
		it( "isInstanceOf() should return true when testing an anonymous object with the Object constructor", function() {
			expect( Class.isInstanceOf( {}, Object ) ).toBe( true );  // orig YUI Test err msg: "isInstanceOf should have returned true"
		} );
		
		
		it( "isInstanceOf() should return true when testing an object of a class", function() {
			var MyClass = Class.extend( Object, { 
				constructor : function() {}
			} );
			
			var myInstance = new MyClass();
			
			expect( Class.isInstanceOf( myInstance, MyClass ) ).toBe( true );  // orig YUI Test err msg: "Should have been true. myInstance is an instance of MyClass"
		} );
		
		
		it( "isInstanceOf() should return true when testing an object that is a subclass of a given class", function() {
			var MyClass = Class.extend( Object, { 
				constructor : function() {}
			} );
			var MySubClass = Class.extend( MyClass, {
				constructor : function() {}
			} );
			
			var myInstance = new MySubClass();
			
			expect( Class.isInstanceOf( myInstance, MyClass ) ).toBe( true );  // orig YUI Test err msg: "Should have been true. myInstance is an instance of MySubClass, which inherits from MyClass"
		} );
		
		
		it( "isInstanceOf() should return false when testing an object that is not an instance of a given class", function() {
			var MyClass = Class.extend( Object, { 
				constructor : function() {}
			} );
			
			var SomeOtherClass = Class.extend( Object, {
				constructor : function() {}
			} );
			
			var myInstance = new SomeOtherClass();
			
			expect( Class.isInstanceOf( myInstance, MyClass ) ).toBe( false );  // orig YUI Test err msg: "Should have been false. myInstance is not an instance of MyClass"
		} );
		
		
		it( "isInstanceOf() should return true when testing an object that has a given mixin class", function() {
			var MyMixinClass = Class.extend( Object, {
				constructor : function() {}
			} );
			
			var MyClass = Class.extend( Object, {
				mixins: [ MyMixinClass ], 
				constructor : function() {}
			} );
			
			var myInstance = new MyClass();
			
			expect( Class.isInstanceOf( myInstance, MyMixinClass ) ).toBe( true );  // orig YUI Test err msg: "Should have been true. myInstance has the mixin MyMixinClass"
		} );
		
		
		it( "isInstanceOf() should return true when testing an object that has a given mixin class implemented in its superclass", function() {
			var MyMixinClass = Class.extend( Object, {
				constructor : function() {}
			} );
			
			var MyClass = Class.extend( Object, {
				mixins : [ MyMixinClass ], 
				constructor : function() {}
			} );
			var MySubClass = Class.extend( MyClass, { 
				constructor : function() {}
			} );
			
			var myInstance = new MySubClass();
			
			expect( Class.isInstanceOf( myInstance, MyMixinClass ) ).toBe( true );  // orig YUI Test err msg: "Should have been true. myInstance has the mixin MyMixinClass through its superclass"
		} );
		
		
		it( "isInstanceOf() should return true when testing an object that has a given mixin class implemented in its superclass's superclass", function() {
			var MyMixinClass = Class.extend( Object, {
				constructor : function() {}
			} );
			
			var MyClass = Class.extend( Object, {
				mixins : [ MyMixinClass ], 
				constructor : function() {}
			} );
			var MySubClass = Class.extend( MyClass, { 
				constructor : function() {}
			} );
			var MySubSubClass = Class.extend( MySubClass, { 
				constructor : function() {}
			} );
			
			var myInstance = new MySubSubClass();
			
			expect( Class.isInstanceOf( myInstance, MyMixinClass ) ).toBe( true );  // orig YUI Test err msg: "Should have been true. myInstance has the mixin MyMixinClass through its superclass's superclass"
		} );
		
	} );
	
	
	describe( "Test isSubclassOf()", function() {
		var thisSuite;
		
		beforeEach( function() {
			thisSuite = {};
			
			thisSuite.Superclass = Class.create( {} );
			thisSuite.Subclass = thisSuite.Superclass.extend( {} );
			thisSuite.SubSubclass = thisSuite.Subclass.extend( {} );
		} );
		
		
		it( "isSubclassOf() should return false if either of the argument values are falsy", function() {
			expect( Class.isSubclassOf( undefined, thisSuite.Superclass ) ).toBe( false );  // orig YUI Test err msg: "should be false with undefined first arg"
			expect( Class.isSubclassOf( thisSuite.Superclass, undefined ) ).toBe( false );  // orig YUI Test err msg: "should be false with undefined second arg"
			expect( Class.isSubclassOf( undefined, undefined ) ).toBe( false );  // orig YUI Test err msg: "should be false with both args undefined"
		} );
		
		
		it( "isSubclassOf() should return true the given classes are equal", function() {
			expect( Class.isSubclassOf( thisSuite.Superclass, thisSuite.Superclass ) ).toBe( true );  // orig YUI Test err msg: "should be true - Superclass is the same class as itself"
			expect( Class.isSubclassOf( thisSuite.Subclass, thisSuite.Subclass ) ).toBe( true );  // orig YUI Test err msg: "should be true - Subclass is the same class as itself"
		} );
		
		
		it( "isSubclassOf() should return true if the subclass is derived from (i.e. extends) superclass", function() {
			expect( Class.isSubclassOf( thisSuite.Subclass, thisSuite.Superclass ) ).toBe( true );  // orig YUI Test err msg: "should be true - Subclass is derived from (i.e. extends) Superclass"
			expect( Class.isSubclassOf( thisSuite.SubSubclass, thisSuite.Superclass ) ).toBe( true );  // orig YUI Test err msg: "should be true - SubSubclass is derived from (i.e. extends) Superclass"
			expect( Class.isSubclassOf( thisSuite.SubSubclass, thisSuite.Subclass ) ).toBe( true );  // orig YUI Test err msg: "should be true - SubSubclass is derived from (i.e. extends) Subclass"
		} );
		
		
		it( "isSubclassOf() should return false if the subclass is *not* derived from superclass", function() {
			expect( Class.isSubclassOf( thisSuite.Superclass, thisSuite.Subclass ) ).toBe( false );  // orig YUI Test err msg: "should be false - Superclass is *not* derived from Subclass"
			expect( Class.isSubclassOf( thisSuite.Subclass, thisSuite.SubSubclass ) ).toBe( false );  // orig YUI Test err msg: "should be false - Subclass is *not* derived from SubSubclass"
		} );
		
	} );
	
	
	describe( "Test hasMixin()", function() {
		var thisSuite;
		
		beforeEach( function() {
			thisSuite = {};
			
			// Hijack the static hasMixin() method on the Class object, so we can determine how many times it is called
			// (to figure out if caching is working)
			thisSuite.originalHasMixinMethod = Class.hasMixin;
			
			thisSuite.hasMixinCallCount = 0;
			Class.hasMixin = function( classToTest, mixinClass ) {
				thisSuite.hasMixinCallCount++;
				return thisSuite.originalHasMixinMethod( classToTest, mixinClass );
			};
		} );
		
		afterEach( function() {
			Class.hasMixin = thisSuite.originalHasMixinMethod;
		} );
		
		
		it( "hasMixin() should check the class for a given mixin", function() {
			var Mixin = Class.extend( Object, {} );
			var SomeOtherMixin = Class.extend( Object, {} );
			
			var MyClass = Class.extend( Object, {	
				mixins : [ Mixin ]
			} );
			
			expect( Class.hasMixin( MyClass, Mixin ) ).toBe( true );  // orig YUI Test err msg: "MyClass should have the mixin 'Mixin'"
			expect( Class.hasMixin( MyClass, SomeOtherMixin ) ).toBe( false );  // orig YUI Test err msg: "MyClass should *not* have the mixin 'SomeOtherMixin'"
		} );
		
		
		it( "hasMixin() should check the class and all of its superclasses for a given mixin", function() {
			var Mixin = Class.extend( Object, {} );
			var SomeOtherMixin = Class.extend( Object, {} );
			var SomeOtherMixin2 = Class.extend( Object, {} );
			var NobodyHasThisMixin = Class.extend( Object, {} );
			
			var MySuperBaseClass = Class.extend( Object, {
				mixins : [ Mixin ]
			} );
			var MyBaseClass = Class.extend( MySuperBaseClass, {
				mixins : [ SomeOtherMixin ]
			} );
			var MyClass = Class.extend( MyBaseClass, {
				mixins : [ SomeOtherMixin2 ]
			} );
			
			// Looping tests twice. First iteration tests the lookup, second tests that caching is working correctly (i.e. has not skewed the result)
			for( var i = 0; i <= 1; i++ ) {
				var pass = ( i === 0 ) ? "initial" : "cached"; 
				expect( Class.hasMixin( MyClass, Mixin ) ).toBe( true );  // orig YUI Test err msg: "MyClass should have the mixin 'Mixin' from its superclass's superclass. pass = " + pass
				expect( Class.hasMixin( MyClass, SomeOtherMixin ) ).toBe( true );  // orig YUI Test err msg: "MyClass should have the mixin 'SomeOtherMixin' on its superclass. pass = " + pass
				expect( Class.hasMixin( MyClass, SomeOtherMixin2 ) ).toBe( true );  // orig YUI Test err msg: "MyClass should have the mixin 'SomeOtherMixin2' on itself. pass = " + pass
				expect( Class.hasMixin( MyClass, NobodyHasThisMixin ) ).toBe( false );  // orig YUI Test err msg: "MyClass should *not* have the mixin 'NobodyHasThisMixin'. pass = " + pass
			}
		} );
		
		
		it( "hasMixin() should work with mixins and classes defined by regular functions (not using extend())", function() {
			var Mixin = function() {};
			var SomeOtherMixin = function() {};
			var NobodyHasThisMixin = function() {};
			
			var MySuperBaseClass = function() {};
			var MyBaseClass = Class.extend( MySuperBaseClass, {
				mixins : [ Mixin ]
			} );
			var MyClass = Class.extend( MyBaseClass, {
				mixins : [ SomeOtherMixin ]
			} );
			
			// Looping tests twice. First iteration tests the lookup, second tests that caching is working correctly
			for( var i = 0; i <= 1; i++ ) {
				var pass = ( i === 0 ) ? "initial" : "cached"; 
				expect( Class.hasMixin( MyClass, Mixin ) ).toBe( true );  // orig YUI Test err msg: "MyClass should have the mixin 'Mixin' from its superclass. pass = " + pass
				expect( Class.hasMixin( MyClass, SomeOtherMixin ) ).toBe( true );  // orig YUI Test err msg: "MyClass should have the mixin 'SomeOtherMixin' on itself. pass = " + pass
				expect( Class.hasMixin( MyClass, NobodyHasThisMixin ) ).toBe( false );  // orig YUI Test err msg: "MyClass should *not* have the mixin 'NobodyHasThisMixin'. pass = " + pass
			}
		} );
		
		
		it( "hasMixin() should assign an id to the mixinClass when the class is provided to hasMixin(), for use with caching if it doesn't already have one", function() {
			var MyMixinClass = Class.extend( Object, {
				constructor : function() {}
			} );
			
			var MyClass = Class.extend( Object, {
				mixins : [ MyMixinClass ], 
				constructor : function() {}
			} );
			
			expect( MyMixinClass.__Class_classId ).toBeUndefined();  // orig YUI Test err msg: "Initial condition: MyClass should not yet have a __Class_classId"
			
			// Now call the hasMixin() function, and check for the classId
			Class.hasMixin( MyClass, MyMixinClass );
			expect( _.isNumber( MyMixinClass.__Class_classId ) ).toBe( true );  // orig YUI Test err msg: "MyClass should now have a numeric __Class_classId"
		} );
		
		
		it( "hasMixin() should create a cache hashmap on the classToTest when the class is provided to hasMixin(), and it should not be re-created during subsequent calls", function() {
			var MyMixinClass = Class.extend( Object, {
				constructor : function() {}
			} );
			
			var MyClass = Class.extend( Object, {
				mixins : [ MyMixinClass ], 
				constructor : function() {}
			} );
			
			expect( MyClass.__Class_hasMixinCache ).toBeUndefined();  // orig YUI Test err msg: "Initial condition: MyClass should not yet have a hasMixinCache"
			
			// Now call the hasMixin() function, and check for the hasMixinCache
			Class.hasMixin( MyClass, MyMixinClass );
			var hasMixinCache = MyClass.__Class_hasMixinCache;
			expect( _.isObject( hasMixinCache ) ).toBe( true );  // orig YUI Test err msg: "MyClass should now have a hasMixinCache"
			
			// Now call the hasMixin() function again, and check that it still has the same hasMixinCache
			Class.hasMixin( MyClass, MyMixinClass );
			expect( MyClass.__Class_hasMixinCache ).toBe( hasMixinCache );  // orig YUI Test err msg: "The has mixin cache should not have been re-created into a new object with a subsequent call to hasMixin()"
		} );
		
		
		it( "hasMixin()'s caching should work", function() {
			var MyMixinClass = Class.extend( Object, {
				constructor : function() {}
			} );
			
			var MyClass = Class.extend( Object, {
				mixins : [ MyMixinClass ], 
				constructor : function() {}
			} );
			var MySubClass = Class.extend( MyClass, { 
				constructor : function() {}
			} );
			
			
			// Upon the first call to hasMixin(), the hasMixinCallCount should be 2, as the superclass had to be checked
			Class.hasMixin( MySubClass, MyMixinClass );
			expect( thisSuite.hasMixinCallCount ).toBe( 2 );  // orig YUI Test err msg: "Initial condition: There should have been 2 calls to hasMixin(), as the superclass had to be checked"
			
			// Now when called again, the hasMixinCallCount should only increase by 1 (putting it at 3), as the result of checking
			// the superclass should have been cached
			Class.hasMixin( MySubClass, MyMixinClass );
			expect( thisSuite.hasMixinCallCount ).toBe( 3 );  // orig YUI Test err msg: "There should have only been 3 calls to hasMixin() (one more than on last use of it), as the result from the superclass now should have been cached"
		} );
		
	} );
	
} );
