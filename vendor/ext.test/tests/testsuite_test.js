new Ext.test.TestSuite({
	  name: 'Ext.test.TestSuite',
	  defaults: {
	      configTestSuite : {
	          name: 'testsuite_1'
	      },
        setUp: function() {
            this.testSession = new Ext.test.Session();
            var conf = Ext.apply(this.configTestSuite, {
                testSession : this.testSession
            });
            this.testSuite = new Ext.test.TestSuite(conf);
		    }, 
	  		tearDown: function() {
            this.testSession.destroy();
            delete this.testSession;
            delete this.testSuite;
        }
	  },
    items: [{
        name : 'Default configuration after instanciation.',
        testDefaultConfiguration: function() {
            Y.Assert.isString(this.testSuite.name, 'testSuite: name');
            Y.Assert.isArray(this.testSuite.items, 'testSuite: items');
            Y.ObjectAssert.areEqual({}, this.testSuite.defaults, 'testSuite: defaults');
            Y.ObjectAssert.areEqual(this.testSession, this.testSuite.testSession, 'testSuite: testSession');
        }
       },{
        name: 'Constructor and Methods.',
        configTestSuite : {
            defaults: {
                EXTJS_ROCKS: true,
                IE_6_IS_NOT_EVIL: false
            },
            items: [{
                ttype: 'testsuite',
                name: 'testsuite_2'
            }, {
                name: 'testcase'
            }]
        },
        setUp: function(){
            this.parentSuite.defaults.setUp.call(this);
            this.testSuite2 = this.testSuite.items[0];
            this.testCase = this.testSuite.items[1];
        },
        tearDown: function(){
            this.parentSuite.defaults.tearDown.call(this);
            delete this.testSuite2;
            delete this.testCase;
        },        
        testSessionRegister: function() {
            var idx = this.testSession.ts.indexOf(this.testSuite);
            Y.Assert.areNotSame(-1, idx, 'testSuite: registered in session');
            Y.Assert.isUndefined(this.testSuite.parentSuite, 'testSuite: no parent suite');
            idx = this.testSession.ts.indexOf(this.testSuite2);
            Y.Assert.areSame(-1, idx, 'testSuite2: not registered in session');
            Y.ObjectAssert.areEqual(this.testSuite, this.testSuite2.parentSuite, 'testSuite2: parent suite');
            idx = this.testSession.tc.indexOf(this.testCase);
            Y.Assert.areSame(-1, idx, 'testCase: not registered in session');
            Y.ObjectAssert.areEqual(this.testSuite, this.testCase.parentSuite, 'testCase: parent suite');
        },
        testDefaults: function() {
            Y.ObjectAssert.hasKeys(['EXTJS_ROCKS', 'IE_6_IS_NOT_EVIL'], this.testSuite2, 'testSuite2: properties');
            Y.Assert.isTrue(this.testSuite2['EXTJS_ROCKS'],'testSuite2: EXTJS_ROCKS is true');
            Y.Assert.isFalse(this.testSuite2['IE_6_IS_NOT_EVIL'],'testSuite2: IE_6_IS_NOT_EVIL is false');
            Y.ObjectAssert.hasKeys(['EXTJS_ROCKS', 'IE_6_IS_NOT_EVIL'], this.testCase, 'testCase: properties');
            Y.Assert.isTrue(this.testCase['EXTJS_ROCKS'],'testCase: EXTJS_ROCKS is true');
            Y.Assert.isFalse(this.testCase['IE_6_IS_NOT_EVIL'],'testCase: IE_6_IS_NOT_EVIL is false');
        },
        testCounts: function(){
            Y.Assert.areSame(1,this.testSuite.getTestCaseCount(), 'testSuite1: count testcases');
            Y.Assert.areSame(1,this.testSuite.getTestSuiteCount(), 'testSuite1: count testsuites');
            Y.Assert.areSame(0,this.testSuite2.getTestCaseCount(), 'testSuite2: count testcases');
            Y.Assert.areSame(0,this.testSuite2.getTestSuiteCount(), 'testSuite2: count testsuites');
        }
    }]
});
