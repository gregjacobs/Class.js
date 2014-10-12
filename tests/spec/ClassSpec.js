/*global Class, describe, beforeEach, afterEach, it, expect, spyOn */
describe( "Class", function() {
	
	describe( 'create()', function() {
		var ClassBuilder = Class.ClassBuilder;
		
		
		it( "should delegate to `ClassBuilder.build()`, calling it with the correct arguments when no `name` param is specified", function() {
			spyOn( ClassBuilder, 'build' );
			
			var overrides = { a: 1, b: 2 };
			Class.create( overrides );
			
			expect( ClassBuilder.build ).toHaveBeenCalledWith( "", Object, overrides );
		} );
		
		
		it( "should delegate to `ClassBuilder.build()`, calling it with the correct arguments when a `name` param is specified", function() {
			spyOn( ClassBuilder, 'build' );
			
			var overrides = { a: 1, b: 2 };
			Class.create( "MyClass", overrides );
			
			expect( ClassBuilder.build ).toHaveBeenCalledWith( "MyClass", Object, overrides );
		} );
		
		
		it( "should create a new class (sanity - rest of the tests for class building are in ClassBuilderSpec.js)", function() {
			var constructorCalled = false,
			    methodCalled = false;
			
			var MyClass = Class.create( {
				constructor : function() { constructorCalled = true; },
				method : function() { methodCalled = true; }
			} );
			
			var instance = new MyClass();
			expect( constructorCalled ).toBe( true );
			expect( instance.method ).toBe( MyClass.prototype.method );
			
			instance.method();
			expect( methodCalled ).toBe( true );
		} );
		
	} );
	
	
	describe( 'extend()', function() {
		var ClassBuilder = Class.ClassBuilder;
		
		it( "should delegate to `ClassBuilder.build()`, calling it with the correct arguments when no `name` or `superclass` param is specified", function() {
			spyOn( ClassBuilder, 'build' );
			
			var overrides = { a: 1, b: 2 };
			Class.extend( overrides );
			
			expect( ClassBuilder.build ).toHaveBeenCalledWith( "", Object, overrides );
		} );
		
		
		it( "should delegate to `ClassBuilder.build()`, calling it with the correct arguments when no `name` param is specified, but `superclass` is", function() {
			spyOn( ClassBuilder, 'build' );
			
			var overrides = { a: 1, b: 2 };
			Class.extend( Object, overrides );
			
			expect( ClassBuilder.build ).toHaveBeenCalledWith( "", Object, overrides );
		} );
		
		
		it( "should delegate to `ClassBuilder.build()`, calling it with the correct arguments when a `name` param is specified, but no `superclass` is", function() {
			spyOn( ClassBuilder, 'build' );
			
			var overrides = { a: 1, b: 2 };
			Class.extend( "MyClass", overrides );
			
			expect( ClassBuilder.build ).toHaveBeenCalledWith( "MyClass", Object, overrides );
		} );
		
		
		it( "should delegate to `ClassBuilder.build()`, calling it with the correct arguments when both `name` and `superclass` params are specified", function() {
			spyOn( ClassBuilder, 'build' );
			
			var overrides = { a: 1, b: 2 };
			Class.extend( "MyClass", Object, overrides );
			
			expect( ClassBuilder.build ).toHaveBeenCalledWith( "MyClass", Object, overrides );
		} );
		
		
		it( "should create a new class (sanity - rest of the tests for class building are in ClassBuilderSpec.js)", function() {
			var constructorCalled = false,
			    methodCalled = false;
			
			var MyClass = Class.extend( Object, {
				constructor : function() { constructorCalled = true; },
				method : function() { methodCalled = true; }
			} );
			
			var instance = new MyClass();
			expect( constructorCalled ).toBe( true );
			expect( instance.method ).toBe( MyClass.prototype.method );
			
			instance.method();
			expect( methodCalled ).toBe( true );
		} );
		
	} );
	
	
	describe( "isInstanceOf()", function() {
		
		it( "should return false for any primitive type", function() {
			expect( Class.isInstanceOf( undefined, Object ) ).toBe( false );  // orig YUI Test err msg: "isInstanceOf should have returned false when given undefined"
			expect( Class.isInstanceOf( null, Object ) ).toBe( false );  // orig YUI Test err msg: "isInstanceOf should have returned false when given null"
			expect( Class.isInstanceOf( 1, Object ) ).toBe( false );  // orig YUI Test err msg: "isInstanceOf should have returned false when given a number"
			expect( Class.isInstanceOf( "hi", Object ) ).toBe( false );  // orig YUI Test err msg: "isInstanceOf should have returned false when given a string"
			expect( Class.isInstanceOf( true, Object ) ).toBe( false );  // orig YUI Test err msg: "isInstanceOf should have returned false when given a boolean"
		} );
		
		
		it( "should return true when testing an anonymous object with the Object constructor", function() {
			expect( Class.isInstanceOf( {}, Object ) ).toBe( true );  // orig YUI Test err msg: "isInstanceOf should have returned true"
		} );
		
		
		it( "should return true when testing an object of a class", function() {
			var MyClass = Class.extend( Object, { 
				constructor : function() {}
			} );
			
			var myInstance = new MyClass();
			
			expect( Class.isInstanceOf( myInstance, MyClass ) ).toBe( true );  // orig YUI Test err msg: "Should have been true. myInstance is an instance of MyClass"
		} );
		
		
		it( "should return true when testing an object that is a subclass of a given class", function() {
			var MyClass = Class.extend( Object, { 
				constructor : function() {}
			} );
			var MySubClass = Class.extend( MyClass, {
				constructor : function() {}
			} );
			
			var myInstance = new MySubClass();
			
			expect( Class.isInstanceOf( myInstance, MyClass ) ).toBe( true );  // orig YUI Test err msg: "Should have been true. myInstance is an instance of MySubClass, which inherits from MyClass"
		} );
		
		
		it( "should return false when testing an object that is not an instance of a given class", function() {
			var MyClass = Class.extend( Object, { 
				constructor : function() {}
			} );
			
			var SomeOtherClass = Class.extend( Object, {
				constructor : function() {}
			} );
			
			var myInstance = new SomeOtherClass();
			
			expect( Class.isInstanceOf( myInstance, MyClass ) ).toBe( false );  // orig YUI Test err msg: "Should have been false. myInstance is not an instance of MyClass"
		} );
		
		
		it( "should return true when testing an object that has a given mixin class", function() {
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
		
		
		it( "should return true when testing an object that has a given mixin class implemented in its superclass", function() {
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
		
		
		it( "should return true when testing an object that has a given mixin class implemented in its superclass's superclass", function() {
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
	
	
	describe( "isSubclassOf()", function() {
		var thisSuite;
		
		beforeEach( function() {
			thisSuite = {};
			
			thisSuite.Superclass = Class.create( {} );
			thisSuite.Subclass = thisSuite.Superclass.extend( {} );
			thisSuite.SubSubclass = thisSuite.Subclass.extend( {} );
		} );
		
		
		it( "should return false if either of the argument values are falsy", function() {
			expect( Class.isSubclassOf( undefined, thisSuite.Superclass ) ).toBe( false );  // orig YUI Test err msg: "should be false with undefined first arg"
			expect( Class.isSubclassOf( thisSuite.Superclass, undefined ) ).toBe( false );  // orig YUI Test err msg: "should be false with undefined second arg"
			expect( Class.isSubclassOf( undefined, undefined ) ).toBe( false );  // orig YUI Test err msg: "should be false with both args undefined"
		} );
		
		
		it( "should return true the given classes are equal", function() {
			expect( Class.isSubclassOf( thisSuite.Superclass, thisSuite.Superclass ) ).toBe( true );  // orig YUI Test err msg: "should be true - Superclass is the same class as itself"
			expect( Class.isSubclassOf( thisSuite.Subclass, thisSuite.Subclass ) ).toBe( true );  // orig YUI Test err msg: "should be true - Subclass is the same class as itself"
		} );
		
		
		it( "should return true if the subclass is derived from (i.e. extends) superclass", function() {
			expect( Class.isSubclassOf( thisSuite.Subclass, thisSuite.Superclass ) ).toBe( true );  // orig YUI Test err msg: "should be true - Subclass is derived from (i.e. extends) Superclass"
			expect( Class.isSubclassOf( thisSuite.SubSubclass, thisSuite.Superclass ) ).toBe( true );  // orig YUI Test err msg: "should be true - SubSubclass is derived from (i.e. extends) Superclass"
			expect( Class.isSubclassOf( thisSuite.SubSubclass, thisSuite.Subclass ) ).toBe( true );  // orig YUI Test err msg: "should be true - SubSubclass is derived from (i.e. extends) Subclass"
		} );
		
		
		it( "should return false if the subclass is *not* derived from superclass", function() {
			expect( Class.isSubclassOf( thisSuite.Superclass, thisSuite.Subclass ) ).toBe( false );  // orig YUI Test err msg: "should be false - Superclass is *not* derived from Subclass"
			expect( Class.isSubclassOf( thisSuite.Subclass, thisSuite.SubSubclass ) ).toBe( false );  // orig YUI Test err msg: "should be false - Subclass is *not* derived from SubSubclass"
		} );
		
	} );
	
	
	describe( "hasMixin()", function() {
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
		
		
		it( "should check the class for a given mixin", function() {
			var Mixin = Class.extend( Object, {} );
			var SomeOtherMixin = Class.extend( Object, {} );
			
			var MyClass = Class.extend( Object, {	
				mixins : [ Mixin ]
			} );
			
			expect( Class.hasMixin( MyClass, Mixin ) ).toBe( true );  // orig YUI Test err msg: "MyClass should have the mixin 'Mixin'"
			expect( Class.hasMixin( MyClass, SomeOtherMixin ) ).toBe( false );  // orig YUI Test err msg: "MyClass should *not* have the mixin 'SomeOtherMixin'"
		} );
		
		
		it( "should check the class and all of its superclasses for a given mixin", function() {
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
		
		
		it( "should work with mixins and classes defined by regular functions (not using extend())", function() {
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
		
		
		it( "should assign an id to the mixinClass when the class is provided to hasMixin(), for use with caching if it doesn't already have one", function() {
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
			expect( typeof MyMixinClass.__Class_classId ).toBe( 'number' );  // orig YUI Test err msg: "MyClass should now have a numeric __Class_classId"
		} );
		
		
		it( "should create a cache hashmap on the classToTest when the class is provided to hasMixin(), and it should not be re-created during subsequent calls", function() {
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
			expect( hasMixinCache ).toBeTruthy();
			expect( typeof hasMixinCache ).toBe( 'object' );  // MyClass should now have a hasMixinCache
			
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
	
	
	describe( 'annotate()', function() {
		
		function numEnumerableProps( obj ) {
			var size = 0;
			for( var prop in obj )
				if( obj.hasOwnProperty( prop ) ) size++;
			
			return size;
		}
		
		it( "should return the method unchanged if no annotations were provided", function() {
			var origFn = function() {},
			    method = Class.annotate( origFn );
			
			expect( numEnumerableProps( method ) ).toBe( 0 );  // shouldn't have any enumerable properties, since none should have been added by annotate()
		} );
		
		
		it( "should add the `override` annotation to a function", function() {
			var origFn = function() {},
			    method = Class.annotate( 'Override', origFn );
			
			expect( method ).toBe( origFn );  // should return the same function
			expect( method.__Class_overrideMethod ).toBe( true );
		} );
		
		
		it( "should add the `final` annotation to a function", function() {
			var origFn = function() {},
			    method = Class.annotate( 'Override', origFn );
			
			expect( method ).toBe( origFn );  // should return the same function
			expect( method.__Class_overrideMethod ).toBe( true );
		} );
		
		
		it( "should be able to add both the `override` and `final` annotation to a function", function() {
			var origFn = function() {},
			    method = Class.annotate( 'Final', 'Override', origFn );
			
			expect( method ).toBe( origFn );  // should return the same function
			expect( method.__Class_overrideMethod ).toBe( true );
			expect( method.__Class_finalMethod ).toBe( true );
		} );
		
		
		it( "should throw an error for an unknown annotation", function() {
			expect( function() {
				Class.annotate( 'Unknown', function(){} );
			} ).toThrowError( "Unknown annotation 'Unknown'" );
		} );
		
	} );
	
	
	describe( 'overrideMethod()', function() {
		
		it( "should annotate a method to be an override method by adding the property `__Class_overrideMethod`", function() {
			var origFn = function() {},
			    method = Class.overrideMethod( origFn );
			
			expect( method ).toBe( origFn );  // should return the same function
			expect( method.__Class_overrideMethod ).toBe( true );
		} );
		
	} );
	
	
	describe( 'final()', function() {
		
		it( "should annotate a method to be an override method by adding the property `__Class_finalMethod`", function() {
			var origFn = function() {},
			    method = Class.finalMethod( origFn );
			
			expect( method ).toBe( origFn );  // should return the same function
			expect( method.__Class_finalMethod ).toBe( true );
		} );
		
	} );
	
} );
