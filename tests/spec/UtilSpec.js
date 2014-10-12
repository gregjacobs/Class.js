/*global Class, describe, beforeEach, afterEach, it, expect */
describe( 'Utility methods', function() {

	describe( 'assign()', function() {
		
		it( "should copy properties from the second object to the first", function() {
			var obj = Class.Util.assign( {}, {
				foo: 1,
				bar: 2
			} );
			expect( obj ).toEqual( { foo: 1, bar: 2 } );
		} );
		
		
		it( "should mutate the object provided as the first argument", function() {
			var obj = {};
			Class.Util.assign(obj, {
				opt1: 'x',
				opt2: 'y'
			});
			expect( obj ).toEqual( { opt1: 'x', opt2: 'y' } );
		} );
		
		
		it( "should overwrite properties in the first object that exist in the second object with the same name", function() {
			var obj = Class.Util.assign({
				foo: 1,
				baz: 4
			}, {
				foo: 2,
				bar: 3
			});
			expect( obj ).toEqual( { foo: 2, bar: 3, baz: 4 } );
		} );
		
		
		it( "should assign from source objects in order of the arguments passed to the function", function() {
			var obj = {};
			Class.Util.assign(obj, {
				foo: 'old',
				exist: true
			}, {
				foo: 'new',
				def: true
			});
			
			expect( obj ).toEqual( { foo: 'new', exist: true, def: true } );
		} );
		
		
		it( "should not overwrite source properties of subsequent objects with properties from earlier objects", function() {
			var obj = Class.Util.assign({}, {
				foo: 'oldFoo',
				bar: 'oldBar'
			},{
				foo: 'foo',
				bar: 'bar'
			});
			expect( obj ).toEqual( { foo: 'foo', bar: 'bar' } );
		} );
		
		
		it( "should return `null` if `null` is provided as the first arg", function() {
			expect( Class.Util.assign(null, {}) ).toBe( null );
		} );
		
	} );
	

	describe( 'defaults()', function() {
		
		it( "should assign the properties of `src` to `dest`, but only properties from `src` that don't exist on `dest`", function() {
			var obj = Class.Util.defaults( { a: 1, b: 2 }, { a: 51, b: 52, c: 53, d: 54 } );
			
			expect( obj ).toEqual( { a: 1, b: 2, c: 53, d: 54 } );
		} );
		
	} );
	
} );