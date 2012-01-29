/**
 * @class Ext.test.view.ProgressBar 
 * A progress bar that shows the state of the Ext.test.TestRunner.
 * @extends Ext.ProgressBar
 * @author  Nicolas FERRERO (aka yhwh) for Sylogix
 * @version 1.3
 * @date	June 4, 2010
 */
Ext.test.view.ProgressBar = Ext.extend(Ext.ProgressBar,{
    // the number of test cases already run
    testCaseCount: 0,
    initComponent: function() {
        this.monitorTestRunner();
        Ext.test.view.ProgressBar.superclass.initComponent.apply(this, arguments);
    },
    // monitor runner
    monitorTestRunner: function() {
        this.mon(Ext.test.Runner, 'begin', this.onBegin, this);
        this.mon(Ext.test.Runner, 'testcasecomplete', this.onTestCaseComplete, this);
        this.mon(Ext.test.Runner, 'testsuitecomplete', this.onTestSuiteComplete, this);
        this.mon(Ext.test.Runner, 'complete', this.onComplete, this);
    },
    onBegin: function() {
        this.testCaseCount = 0;
    },
    onTestCaseComplete: function() {
        this.testCaseCount++;
    },
    // update progress bar after each test suite run
    onTestSuiteComplete: function() {
        var count = Ext.test.Session.getTestCaseCount();
        var c = this.testCaseCount / count;
        this.updateProgress(c, Math.round(100 * c) + '% completed...')
    },
    // force ending
    onComplete: function() {
        this.updateProgress(1, '100% completed...');
    }
});
Ext.reg('testprogressbar', Ext.test.view.ProgressBar);
