/*global Class, describe, beforeEach, afterEach, it, expect */
describe( "ClassBuilder", function() {
	var ClassBuilder = Class.ClassBuilder;
	
	
	describe( 'build()', function() {
		
		it( "should build a simple class that extends from Object", function() {
			var constructorCalled = false,
			    methodCalled = false;
			
			var MyClass = ClassBuilder.build( 'MyClass', Object, {
				constructor : function() { constructorCalled = true; },
				method : function() { methodCalled = true; }
			} );
			
			var instance = new MyClass();
			expect( instance.constructor.displayName ).toBe( 'MyClass' );
			expect( constructorCalled ).toBe( true );
			expect( instance.method ).toBe( MyClass.prototype.method );
			
			instance.method();
			expect( methodCalled ).toBe( true );
		} );
		
		
		describe( "prototypal inheritance chain", function() {
			
			it( "should build a class that extends from a superclass using a single inheritance prototype chain", function() {
				var constructorCalled = false,
				    methodCalled = false;
				
				var Animal = ClassBuilder.build( 'Animal', Object, {
					constructor : function( name ) { this._name = name; },
					getName     : function() { return this._name; }
				} );
				
				var Cat = ClassBuilder.build( 'Cat', Animal, {
					constructor: function() {
						this._super( arguments );
						this._willMeow = true;
					},
					
					willMeow : function() { return this._willMeow; }
				} );
				
				var kitty = new Cat( 'Trevor' );
				expect( kitty.constructor.displayName ).toBe( 'Cat' );
				expect( kitty.getName() ).toEqual( 'Trevor' );
				expect( kitty.willMeow() ).toBe( true );
			} );
			
			
			it( "should add a static 'superclass' property to the subclass that refers to its superclass's prototype", function() {
				var Superclass = ClassBuilder.build( "Superclass", Object, {} );
				var Subclass = ClassBuilder.build( "Subclass", Superclass, {} );
				
				expect( Subclass.superclass ).toBe( Superclass.prototype );
			} );
			
			
			it( "should fix the constructor property on the prototype to point back to its actual constructor, when no user-defined constructor is declared", function() {
				var MyClass = ClassBuilder.build( "", Object, {} );
				var MySubClass = MyClass.extend( {} );
				
				var myClassInstance = new MyClass();
				var mySubClassInstance = new MySubClass();
				
				expect( myClassInstance.constructor ).toBe( MyClass );  // base class should have its constructor prototype property set to its constructor
				expect( mySubClassInstance.constructor ).toBe( MySubClass );  // subclass should have its constructor prototype property set to its constructor
			} );
			
			
			it( "should fix the constructor property on the prototype to point back to its actual constructor, when a user-defined constructor is declared", function() {
				var Superclass = ClassBuilder.build( "Superclass", Object, { constructor: function(){} } );
				var Subclass = ClassBuilder.build( "Subclass", Superclass, { constructor: function(){} } );
				
				var superClassInstance = new Superclass();
				var subClassInstance = new Subclass();
				
				expect( superClassInstance.constructor ).toBe( Superclass );  // base class should have its constructor prototype property set to its constructor
				expect( subClassInstance.constructor ).toBe( Subclass );  // subclass should have its constructor prototype property set to its constructor
			} );
			
			
			it( "if a constructor returns a different object than its `this` reference, that object should be returned when instantiating the class", function() {
				var MyClass = Class.extend( {
					constructor : function() {
						return { hi: 1 };  // change the object that is returned from the constructor
					}
				} );
				
				var instance = new MyClass();
				expect( instance.hi ).toBe( 1 );
			} );
			
			
			it( "if no explicit constructor is provided, should set up a constructor which returns the value of its superclass's constructor (in case the constructor changes the object that is created)", function() {
				var MyClass = Class.extend( {
					constructor : function() {
						return { hi: 1 };  // change the object that is returned from the constructor
					}
				} );				
				var MySubClass = MyClass.extend( {} );
				
				var instance = new MySubClass();
				expect( instance.hi ).toBe( 1 );
			} );
			
		} );
		
		
		describe( "this._super() functionality for calling superclass methods", function() {
			
			it( "should allow the constructor of a class that extends from Object to call its superclass constructor", function() {
				expect( function() {
					var MyClass = ClassBuilder.build( "MyClass", Object, {
						constructor : function() {
							this._super();
						}
					} );
				} ).not.toThrow();
			} );
			
			
			it( "should create the this._super() method for subclass constructor functions", function() {
				var superclassConstructorCallCount = 0;
				
				var A = ClassBuilder.build( "", Object, {
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
				expect( superclassConstructorCallCount ).toBe( 1 );
				
				// As an extra sanity check, make sure the instance is an instance of A and B
				expect( instance instanceof A ).toBe( true );
				expect( instance instanceof B ).toBe( true );
			} );
			
			
			it( "should call the constructor implementation in the correct scope for both user-defined constructors, and default constructors", function() {
				var methodCallCount = 0;
				
				var Superclass = ClassBuilder.build( "Superclass", Object, {
					constructor : function() {
						this.method();
					},
					method : function() {
						methodCallCount++;
					}
				} );
				var Subclass = ClassBuilder.build( "Subclass", Superclass, {
					constructor : function() {
						this._super( arguments );
						this.method();
					}
				} );
				
				var instance = new Subclass();
				expect( methodCallCount ).toBe( 2 );  // called once from each class's constructor
				
				// Reset the count and try with a class with a default constructor
				methodCallCount = 0;
				var SubSubclass = ClassBuilder.build( "SubSubClass", Subclass, {
					// This subclass tests the default constructor
				} );
				instance = new SubSubclass();
				expect( methodCallCount ).toBe( 2 );  // called once from each class's constructor
			} );
			
			
			it( "should create the this._super() method for subclass constructor functions, and be able to pass up the arguments", function() {
				var superclassConstructorArgs;
				    
				var A = ClassBuilder.build( "", Object, {
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
				expect( superclassConstructorArgs.length ).toBe( 3 );
				expect( superclassConstructorArgs[ 0 ] ).toBe( 1 );
				expect( superclassConstructorArgs[ 1 ] ).toBe( 2 );
				expect( superclassConstructorArgs[ 2 ] ).toBe( 3 );
			} );
			
			
			it( "should allow a constructor of a class that is directly inherited from Object to be able to call the superclass constructor", function() {
				var A = ClassBuilder.build( "", Object, {
					constructor : function() {
						this._super();
					}
				} );
				
				expect( function() {
					var instance = new A();
				} ).not.toThrow();
			} );
			
			
			it( "should create the this._super() method for subclass constructor functions, even if the superclass is not defined using Class.extend()", function() {
				var superclassCtorCallCount = 0;
				var Superclass = function() {
					superclassCtorCallCount++;
				};
				
				var Subclass = ClassBuilder.build( "", Superclass, {
					constructor : function() {
						this._super();
					}
				} );
				
				var instance = new Subclass();
				expect( superclassCtorCallCount ).toBe( 1 );
			} );
			
			
			it( "should create the this._super() method for subclass constructor functions, even if the superclass does not explicitly define a constructor", function() {
				var superclassConstructorCallCount = 0;
				
				var Superclass = ClassBuilder.build( "", Object, {} );
				var Subclass = Superclass.extend( {
					constructor : function() {
						this._super();
						
						this.myVar = 0;
					}
				} );
				
				var instance = new Subclass();
				// Note: Test should simply not throw an error, but check that B's `myVar` instance variable is set
				expect( instance.myVar ).toBe( 0 );
			} );
			
			
			it( "should create the this._super() method for subclass methods that have a corresponding superclass method", function() {
				var methodCallCount = 0;
				
				var Superclass = ClassBuilder.build( "", Object, {
					method : function() {
						methodCallCount++;
					}
				} );
				
				var Subclass = ClassBuilder.build( "", Superclass, {
					method : function() {
						this._super();
					}
				} );
				
				var instance = new Subclass();
				instance.method();
				expect( methodCallCount ).toBe( 1 );
			} );
			
			
			it( "should create the this._super() method for subclass methods that have a corresponding superclass method, and be able to pass up arguments", function() {
				var superclassMethodArgs;
				
				var Superclass = ClassBuilder.build( "", Object, {
					method : function() {
						superclassMethodArgs = arguments;
					}
				} );
				
				var Subclass = Superclass.extend( {
					method : function( a, b, c ) {
						this._super( arguments );
					}
				} );
				
				
				var instance = new Subclass();
				instance.method( 1, 2, 3 );
				expect( superclassMethodArgs.length ).toBe( 3 );
				expect( superclassMethodArgs[ 0 ] ).toBe( 1 );
				expect( superclassMethodArgs[ 1 ] ).toBe( 2 );
				expect( superclassMethodArgs[ 2 ] ).toBe( 3 );
			} );
			
			
			it( "should create the this._super() method, and return the value from the call to this._super()", function() {
				var Superclass = ClassBuilder.build( "", Object, {
					method : function() {
						return 42;
					}
				} );
				
				var Subclass = Superclass.extend( {
					method : function() {
						return this._super();
					}
				} );
				
				var instance = new Subclass();
				var methodResult = instance.method();
				expect( methodResult ).toBe( 42 );
			} );
			
			
			it( "should create the this._super() method for subclass methods that have a corresponding superclass method, even if the superclass is not defined using Class.extend()", function() {
				var methodCallCount = 0;
				
				var Superclass = function(){};
				Superclass.prototype.method = function() {
					methodCallCount++;
				};
				
				var Subclass = ClassBuilder.build( "", Superclass, {
					method : function() {
						this._super();
					}
				} );
				
				var instance = new Subclass();
				instance.method();
				expect( methodCallCount ).toBe( 1 );
			} );
			
			
			it( "should NOT create the this._super() method for subclass methods that do not have a corresponding superclass method", function() {
				var methodCallCount = 0;
				
				var A = ClassBuilder.build( "", Object, {
					// note: no superclass method
				} );
				
				var B = A.extend( {
					method : function() {
						this._super();
					}
				} );
				
				var instance = new B();
				expect( function() {
					instance.method();
				} ).toThrowError( /\b_super\b|'?undefined'? is not a function|object doesn't support this property or method/ );
			} );
			
			
			it( "should NOT create the this._super() method for subclass methods that do not call _super()", function() {
				var methodCallCount = 0;
				
				var A = ClassBuilder.build( "", Object, {
					// note: no superclass method
				} );
				
				var B = A.extend( {
					method : function() {
						// Piece together the "_super" string, to fool the code into thinking that this method
						// does not call its superclass method. However, in real-world code, this wouldn't (or at least 
						// shouldn't!) be done, so real-world code will be fine
						var parentMethod = '_' + 's' + 'u' + 'p' + 'e' + 'r';
						this[ parentMethod ]();
					}
				} );
				
				var instance = new B();
				
				expect( function() {
					instance.method();
				} ).toThrowError( /\b_super\b|'?undefined'? is not a function|object doesn't support this property or method/ );
			} );
			
			
			it( "should *not* wrap the constructor function of another class with the _super() calling method", function() {
				var InnerClass = ClassBuilder.build( "", Object, {
					constructor : function() {
						this._super();   // This constructor calls this._super(), but we won't want it wrapped with the this._super() calling function from OuterClass
					}
				} );
				
				var OuterSuperClass = ClassBuilder.build( "", Object, {  // a superclass, because 'innerClass' will only be wrapped if the superclass has a property with the same name, and is also a function
					innerClass : function() {}
				} );
				var OuterSubClass = OuterSuperClass.extend( {
					innerClass : InnerClass
				} );
				
				expect( OuterSubClass.prototype.innerClass ).toBe( InnerClass );
			} );
			
			
			it( "should *not* wrap the constructor function of another class with the _super() calling method, in JS implementations that do not support reading the function's text", function() {
				// A "class" that will be wrapped by the this._super() calling method. This is to emulate a class created with Class.js on browsers that *do*
				// support reading the function's text. We can't use the actual constructor that Class.js creates, because that does not have the text "_super" in it
				var InnerClass = function() {
					this._super();   // This constructor calls this._super(), but we won't want it wrapped with the this._super() calling function from OuterClass
				};
				InnerClass.__Class = true;  // the flag we're using to determine if a constructor function is a class. No other way to determine...  This is set when the class is created.
				
				var OuterSuperClass = ClassBuilder.build( "", Object, {  // a superclass, because 'innerClass' will only be wrapped if the superclass has a property with the same name, and is also a function
					innerClass : function() {}
				} );
				var OuterSubClass = OuterSuperClass.extend( {
					innerClass : InnerClass
				} );
				
				expect( OuterSubClass.prototype.innerClass ).toBe( InnerClass );
			} );
			
		} );
		
		
		describe( "Test `statics` functionality", function() {
			
			it( "should add static properties defined in `statics`", function() {
				var MyClass = ClassBuilder.build( "", Object, {
					statics : {
						staticFn1 : function() {},
						staticFn2 : function() {}
					}
				} );
				
				expect( typeof MyClass.staticFn1 ).toBe( 'function' );
				expect( typeof MyClass.staticFn2 ).toBe( 'function' );
			} );
			
			
			it( "The static properties defined in `statics` should not be inherited to subclasses", function() {
				var Superclass = ClassBuilder.build( "", Object, {
					statics : {
						staticFn : function() {}
					}
				} );
				var Subclass = ClassBuilder.build( "", Superclass, {} );
				
				expect( typeof Superclass.staticFn ).toBe( 'function' );
				expect( Subclass.staticFn ).toBeUndefined();
			} );
			
			
			it( "The static methods defined in `statics` should have their `this` reference set to their class when executed", function() {
				var thisReference;
				
				var MyClass = ClassBuilder.build( "", Object, {
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
		
		
		describe( "`inheritedStatics` functionality", function() {
			
			it( "should add static properties defined in `inheritedStatics`", function() {
				var MyClass = ClassBuilder.build( "", Object, {
					inheritedStatics : {
						staticFn1 : function() {},
						staticFn2 : function() {}
					}
				} );
				
				expect( typeof MyClass.staticFn1 ).toBe( 'function' );
				expect( typeof MyClass.staticFn2 ).toBe( 'function' );
			} );
			
			
			it( "The static properties defined in `inheritedStatics` should be inherited to subclasses", function() {
				var staticFn = function() {};
				
				var Superclass = ClassBuilder.build( "", Object, {
					inheritedStatics : {
						staticFn : staticFn
					}
				} );
				var Subclass = Superclass.extend( {} );
				var SubSubclass = Subclass.extend( {} );
				var SubSubSubclass = SubSubclass.extend( {} );
				
				expect( Superclass.staticFn ).toBe( staticFn );
				expect( Subclass.staticFn ).toBe( staticFn );
				expect( SubSubclass.staticFn ).toBe( staticFn );
				expect( SubSubSubclass.staticFn ).toBe( staticFn );
			} );
			
			
			it( "The static properties defined in `inheritedStatics` should be inherited to subclasses, but not affect superclasses", function() {
				var staticFn = function() {};
				
				var Superclass = Class.extend( {} );
				var Subclass = Superclass.extend( {} );
				var SubSubclass = Subclass.extend( {
					inheritedStatics : {
						staticFn : staticFn
					}
				} );
				var SubSubSubclass = SubSubclass.extend( {} );
				
				expect( Superclass.staticFn ).toBeUndefined();
				expect( Subclass.staticFn ).toBeUndefined();
				expect( SubSubclass.staticFn ).toBe( staticFn );
				expect( SubSubSubclass.staticFn ).toBe( staticFn );
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
				
				expect( MyClass.method ).toBe( method );
				expect( MySubClass.method ).toBe( subclassMethod );
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
				
				expect( MyClass.method ).toBe( inheritedMethod );
				expect( MySubClass.method ).toBe( overrideStaticMethod );
				expect( MySubSubClass.method ).toBe( inheritedMethod );
			} );
			
			
			it( "The static methods defined in `inheritedStatics` should have their `this` reference set to their class when executed", function() {
				var thisReference;
				
				var MyClass = ClassBuilder.build( "", Object, {
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
		
		
		describe( "Test mixin functionality", function() {
			
			it( "should be able to add in a single mixin class into another class", function() {
				var mixinFnExecuted = false; 
				
				var Mixin = ClassBuilder.build( "", Object, {
					mixinFn : function() {
						mixinFnExecuted = true;
					}
				} );
				
				var MyClass = ClassBuilder.build( "", Object, {
					mixins : [ Mixin ]
				} );
				
				
				var instance = new MyClass(); 
				instance.mixinFn();   // execute the function
				expect( mixinFnExecuted ).toBe( true );
			} );
			
			
			it( "should not overwrite a class's methods/properties with a mixin's methods/properties", function() {
				var data = null; 
				
				var Mixin = ClassBuilder.build( "", Object, {
					testProp : "Mixin defined",
					testMethod : function() {
						data = "Mixin defined";
					}
				} );
				
				var MyClass = ClassBuilder.build( "", Object, {
					mixins : [ Mixin ],
					
					testProp : "MyClass defined",
					testMethod : function() {
						data = "MyClass defined";
					}
				} );
				
				
				var instance = new MyClass(); 
				expect( instance.testProp ).toBe( "MyClass defined" );
				
				instance.testMethod();
				expect( data ).toBe( "MyClass defined" );
			} );
			
			
			it( "should have later-defined mixins take precedence over earlier-defined mixins", function() {
				var Mixin1 = ClassBuilder.build( "", Object, {
					testProp : "Mixin1 defined"
				} );
				var Mixin2 = ClassBuilder.build( "", Object, {
					testProp : "Mixin2 defined"
				} );
				
				var MyClass = ClassBuilder.build( "", Object, {
					mixins : [ Mixin1, Mixin2 ]
				} );
				
				var instance = new MyClass();
				expect( instance.testProp ).toBe( "Mixin2 defined" );
			} );
			
			
			it( "should have set up the static hasMixin() method, which should check the class for a given mixin", function() {
				var Mixin = ClassBuilder.build( "", Object, {} );
				var SomeOtherMixin = ClassBuilder.build( "", Object, {} );
				
				var MyClass = ClassBuilder.build( "", Object, {	
					mixins : [ Mixin ]
				} );
				
				expect( MyClass.hasMixin( Mixin ) ).toBe( true );
				expect( MyClass.hasMixin( SomeOtherMixin ) ).toBe( false );
			} );
			
			
			it( "should have set up the instance hasMixin() method, which should check an instance for a given mixin", function() {
				var Mixin = ClassBuilder.build( "", Object, {} );
				var SomeOtherMixin = ClassBuilder.build( "", Object, {} );
				
				var MyClass = ClassBuilder.build( "", Object, {	
					mixins : [ Mixin ]
				} );
				var myInstance = new MyClass();
				
				expect( myInstance.hasMixin( Mixin ) ).toBe( true );
				expect( myInstance.hasMixin( SomeOtherMixin ) ).toBe( false );
			} );
			
		} );
		
		
		describe( "Test `abstractClass` functionality", function() {
			
			it( "A class created with `abstractClass: true` should not be able to be instantiated when declared with no constructor", function() {
				expect( function() {
					var AbstractClass = ClassBuilder.build( "", Object, {
						abstractClass: true
					} );
					
					var instance = new AbstractClass();
				} ).toThrowError( "Error: Cannot instantiate abstract class" );
				
				
				// Check error message if the class has a display name
				expect( function() {
					var AbstractClass = ClassBuilder.build( 'MyAbstractClass', Object, {
						abstractClass: true
					} );
					
					var instance = new AbstractClass();
				} ).toThrowError( "Error: Cannot instantiate abstract class 'MyAbstractClass'" );
			} );
			
			
			it( "A class created with `abstractClass: true` should not be able to be instantiated when declared with its own constructor", function() {
				expect( function() {
					var AbstractClass = ClassBuilder.build( "", Object, {
						abstractClass: true,
						
						// Declare own constructor
						constructor : function() {}
					} );
					
					var instance = new AbstractClass();
				} ).toThrowError( "Error: Cannot instantiate abstract class" );
				
				
				// Check error message if the class has a display name
				expect( function() {
					var AbstractClass = ClassBuilder.build( 'MyAbstractClass', Object, {
						abstractClass: true,
						
						// Declare own constructor
						constructor : function() {}
					} );
					
					var instance = new AbstractClass();
				} ).toThrowError( "Error: Cannot instantiate abstract class 'MyAbstractClass'" );
			} );
			
			
			it( "A subclass of an abstract class (which doesn't define its own constructor) should be able to be instantiated", function() {
				var AbstractClass = ClassBuilder.build( "", Object, {
					abstractClass: true
				} );
				var ConcreteClass = AbstractClass.extend( {
					
				} );
				
				expect( function() {
					var instance = new ConcreteClass();
				} ).not.toThrow();
			} );
			
			
			it( "A subclass of an abstract class (which *does* define its own constructor) should be able to be instantiated", function() {
				var abstractClassConstructorCallCount = 0;
				
				var AbstractClass = ClassBuilder.build( "", Object, {
					abstractClass: true,
					
					constructor : function() {
						abstractClassConstructorCallCount++;
					}
				} );
				var ConcreteClass = AbstractClass.extend( {
					
				} );
				
				var instance = new ConcreteClass();
				expect( abstractClassConstructorCallCount ).toBe( 1 );
			} );
			
			
			it( "An abstract class's constructor should be able to be executed from the concrete class", function() {
				var abstractClassConstructorCallCount = 0;
				
				var AbstractClass = ClassBuilder.build( "", Object, {
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
				expect( abstractClassConstructorCallCount ).toBe( 1 );
			} );
			
			
			it( "should throw an error for a class with abstract methods that is not declared with abstractClass: true", function() {
				expect( function() {
					var ConcreteClass = ClassBuilder.build( "", Object, {
						concreteMethod : function() {},
						abstractMethod : Class.abstractMethod
					} );
				} ).toThrowError( "The class being created has abstract method 'abstractMethod', but is not declared with 'abstractClass: true'" );
				
				// Check message when the class has a display name
				expect( function() {
					var ConcreteClass = ClassBuilder.build( 'Concrete', Object, {
						concreteMethod : function() {},
						abstractMethod : Class.abstractMethod
					} );
				} ).toThrowError( "The class 'Concrete' has abstract method 'abstractMethod', but is not declared with 'abstractClass: true'" );
			} );
			
			
			it( "should throw an error if a concrete class does not implement all abstract methods from its superclass", function() {
				var AbstractClass = ClassBuilder.build( "", Object, {
					abstractClass : true,
					
					concreteMethod : function() {},
					abstractMethod1 : Class.abstractMethod,
					abstractMethod2 : Class.abstractMethod
				} );
				
				
				expect( function() {
					var ConcreteClass = AbstractClass.extend( {
						abstractMethod1 : function(){}  // *** Only implement 1 of the 2 abstract methods
					} );
				} ).toThrowError( "The concrete subclass being created must implement abstract method: 'abstractMethod2', or be declared abstract as well (using 'abstractClass: true')" );
				
				
				// Check error message when the class has a display name
				expect( function() {
					var ConcreteClass = AbstractClass.extend( 'Concrete', {
						abstractMethod1 : function(){}  // *** Only implement 1 of the 2 abstract methods
					} );
				} ).toThrowError( "The concrete subclass 'Concrete' must implement abstract method: 'abstractMethod2', or be declared abstract as well (using 'abstractClass: true')" );
			} );
			
			
			it( "should allow a properly defined abstract class with abstract methods, and a concrete class with the abstract methods implemented", function() {
				var AbstractClass = ClassBuilder.build( "", Object, {
					abstractClass : true,
					
					concreteMethod : function() {},
					abstractMethod1 : Class.abstractMethod,
					abstractMethod2 : Class.abstractMethod
				} );
				
				expect( function() {
					var ConcreteClass = AbstractClass.extend( {
						// Implement both of the abstract methods
						abstractMethod1 : function(){},
						abstractMethod2 : function(){}
					} );
				} ).not.toThrow();  // The above should simply not error -- both abstract methods have been implemented by ConcreteClass 
			} );
			
			
			it( "should allow a hierarchy of properly defined abstract classes with abstract methods, and a concrete class with the abstract methods implemented", function() {
				var AbstractClass = ClassBuilder.build( "", Object, {
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
				
				expect( function() {
					var ConcreteClass = AbstractSubclass.extend( {
						// Implement the other abstract method
						abstractMethod2 : function(){}
					} );
				} ).not.toThrow();  // This test should simply not error -- abstractMethod1 implemented by AbstractSubclass, and abstractMethod2 implemented by ConcreteClass
			} );
			
		} );
		
		
		describe( "static onClassCreate()", function() {
			
			it( "if it exists as a static, should be executed after all other extend functionality has completed", function() {
				var onClassCreateCallCount = 0;
				
				var MyMixin = ClassBuilder.build( "", Object, {
					mixinInstanceMethod : function() {}
				} );
				
				var MyClass = ClassBuilder.build( "", Object, {
					statics : {
						onClassCreate : function( newClass ) {
							onClassCreateCallCount++;
							
							// ASSERTS CONTINUE HERE
							expect( typeof newClass.someStaticMethod ).toBe( 'function' );
							expect( typeof newClass.someInheritedStaticMethod ).toBe( 'function' );
							expect( typeof newClass.prototype.mixinInstanceMethod ).toBe( 'function' );
							expect( this ).toBe( newClass );  // should be called in the scope of the class too
						},
						
						someStaticMethod : function() {}
					},
					
					inheritedStatics : {
						someInheritedStaticMethod : function() {}
					},
					
					mixins : [ MyMixin ]
				} );
				
				expect( onClassCreateCallCount ).toBe( 1 );  // to make sure the function actually runs
				// NOTE: Asserts continue inside onClassCreate
			} );
			
			
			it( "if it exists as an inherited static, should be executed for all subclasses", function() {
				var onClassCreateCallCount = 0,
				    currentClassPassedIn;
				
				var MyClass = ClassBuilder.build( "", Object, {
					inheritedStatics : {
						onClassCreate : function( newClass ) {
							onClassCreateCallCount++;
							currentClassPassedIn = newClass;
						}
					}
				} );
				
				expect( onClassCreateCallCount ).toBe( 1 );
				expect( currentClassPassedIn ).toBe( MyClass );
				
				
				// Now create a subclass, without an explicit onClassCreate function. It should be used from the superclass
				var MySubClass = MyClass.extend( {} );
				
				expect( onClassCreateCallCount ).toBe( 2 );
				expect( currentClassPassedIn ).toBe( MySubClass );
			} );
			
			
			it( "should be allowed to be specified as `onClassCreated`, for backward compatibility", function() {
				var onClassCreatedCallCount = 0,
				    classArg,
				    onClassCreatedScope;
				
				var MyClass = ClassBuilder.build( "", Object, {
					inheritedStatics : {
						onClassCreated : function( newClass ) {
							onClassCreatedCallCount++;
							
							classArg = newClass;
							onClassCreatedScope = this;
						}
					}
				} );
				
				expect( onClassCreatedCallCount ).toBe( 1 );
				expect( classArg ).toBe( MyClass );
				expect( onClassCreatedScope ).toBe( MyClass );
			} );
			
			
			it( "should be allowed to be specified as `onClassExtended`, for backward compatibility", function() {
				var onClassExtendedCallCount = 0,
				    classArg,
				    onClassExtendedScope;
				
				var MyClass = ClassBuilder.build( "", Object, {
					inheritedStatics : {
						onClassExtended : function( newClass ) {
							onClassExtendedCallCount++;
							
							classArg = newClass;
							onClassExtendedScope = this;
						}
					}
				} );
				
				expect( onClassExtendedCallCount ).toBe( 1 );
				expect( classArg ).toBe( MyClass );
				expect( onClassExtendedScope ).toBe( MyClass );
			} );
			
		} );
		
		
		describe( 'static `extend()` method placed on subclasses', function() {
			
			it( "should add a static `extend` method to the subclass, which can be used to extend it", function() {
				var Superclass = ClassBuilder.build( "Superclass", Object, {
					method : function() {}
				} );
				
				var Subclass = Superclass.extend( {} );
				var instance = new Subclass();
				
				expect( instance instanceof Superclass ).toBe( true );
				expect( instance instanceof Subclass ).toBe( true );
				expect( instance.method ).toBe( Superclass.prototype.method );
			} );
			
		
			it( "should accept a displayName argument for the new class when using the static `extend()` method placed on the superclass", function() {
				var Superclass = ClassBuilder.build( "Superclass", Object, {
					method : function() {}
				} );
				
				var Subclass = Superclass.extend( "Subclass", {} );
				var instance = new Subclass();
				
				expect( instance instanceof Superclass ).toBe( true );
				expect( instance instanceof Subclass ).toBe( true );
				expect( instance.method ).toBe( Superclass.prototype.method );
				expect( instance.constructor.displayName ).toBe( "Subclass" );
			} );
			
		} );
		
	} );
	
} );
