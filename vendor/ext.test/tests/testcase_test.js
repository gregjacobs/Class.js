new Ext.test.TestSuite({
	  name: 'Ext.test.TestCase',
	  defaults: {
	      configTestCase : {},
        setUp: function() {
            this.testSession = new Ext.test.Session();
            var conf = Ext.apply(this.configTestCase, {
                testSession : this.testSession
            });
            this.testCase = new Ext.test.TestCase(conf);
		    }, 
	  		tearDown: function() {
            this.testSession.destroy();
            delete this.testSession;
            delete this.testCase;
        }
	  },
    items: [{
        name : 'Default configuration after instanciation',
        testDefaultConfiguration: function() {
            Y.Assert.isFalse(this.testCase.autoReg, 'testCase: autoReg');
            Y.Assert.isString(this.testCase.name, 'testCase: name');
            Y.ObjectAssert.areEqual(this.testSession, this.testCase.testSession, 'testCase: testSession');
        }
       },{
        name: 'Constructor.',
        configTestCase: {
            autoReg: true
        },
        testSessionRegister: function() {
            var idx = this.testSession.tc.indexOf(this.testCase);
            Y.Assert.areNotSame(-1, idx, 'testCase: is registered');
        }
    }]
});
