new Ext.test.TestSuite({
	/* testSuite name */
	name : 'Ext.ux.bootMask Sample 1'
	
	/* This defaults function are available for all TestCase */
	,defaults : {
		/**
		* The setUp method create a div in the body allowing to render
		* bootMask into. This method is run before each test.
		*/
		setUp : function() {
			this.el = Ext.getBody().createChild({tag: 'div'});
			this.bootMask = new Ext.ux.bootMask(this.el,{
				msg : 'Test'
			});
		} 
	
		/**
		* The tearDown method is run after each test. It destroy the element 
		* and bootMask instancied in setUp.
		*/
		,tearDown : function() {
			this.bootMask.destroy();
			Ext.destroy(this.el);
		}
	}
	
	/* Here the testCases */
	,items : [
		{
			/* testCase name */
			name : 'Test defaultValues'
			
			/* Test default class values */
			,testDefaultValues : function() {
				Y.Assert.areEqual(11000, this.bootMask.zIndex, 'Test zIndex default value');
			}
		},
		
		{
			/* testCase name */
			name : 'onBeforeLoad'
		
			/* Test if the setted zIndex after a bootMask show is valid */  
			,testZindex : function(){
				this.bootMask.show();
				var mask = this.el.child('.ext-el-mask');
				var zindex = mask.getStyle('z-index');
				Y.Assert.areEqual(zindex, this.bootMask.zIndex, 'Test to ensure that global mask z-index is valid.');
			}
			/* Test that mask is not created if bootMask is disabled */
			,testDisable : function(){
				this.bootMask.disable();
				this.bootMask.show();
				var mask = this.el.child('.ext-el-mask');
				Y.Assert.isNull(mask, 'Test that mask is not created when Ext.ux.bootMask is disabled');
			}
		}
	]
});


new Ext.test.TestCase({
  // the name of the testCase
   name : 'Test defaultValues, zIndex and disable'
  // Important automatically register testCase in Ext.test.Session
  , autoReg : true
  /**
   * The setUp method create a div in the body allowing to render
   * bootMask into. This method is run before each test.
   */
  , setUp : function() {
      this.el = Ext.getBody().createChild({tag: 'div'});
      this.bootMask = new Ext.ux.bootMask(this.el,{
				msg: 'Test'
      });
  }    
  /**
   * The tearDown method is run after each test. It destroy the element 
   * and bootMask instancied in setUp.
   */
  , tearDown : function() {
      this.bootMask.destroy();
      Ext.destroy(this.el);
  }
  /* Test default class values */
  , testDefaultValues: function() {
      Y.Assert.areEqual(11000, this.bootMask.zIndex, 'Test zIndex default value');
  }
  /* Test if the setted zIndex after a bootMask show is valid */
  , testZindex : function(){
      this.bootMask.show();
      var mask = this.el.child('.ext-el-mask');
      var zindex = mask.getStyle('z-index');
      Y.Assert.areEqual(zindex, this.bootMask.zIndex, 'Test to ensure that global mask z-index is valid.');
  }
  /* Test that mask is not created if bootMask is disabled */
  , testDisable : function(){
	    this.bootMask.disable();
	    this.bootMask.show();
	    var mask = this.el.child('.ext-el-mask');
	    Y.Assert.isNull(mask, 'Test that mask is not created when Ext.ux.bootMask is disabled');
  }
}); 

