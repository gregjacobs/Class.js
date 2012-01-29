/**
 * @class Ext.test.view.Logger
 * A Console that show Ext.test.Runner events.
 * @extends Ext.grid.GridPanel
 * @author  Nicolas FERRERO (aka yhwh) for Sylogix
 * @version 1.3
 * @date	June 4, 2010
 */
Ext.test.view.Logger = Ext.extend(Ext.grid.GridPanel, {
    autoWidth: true,
    viewConfig: {
        forceFit: true
    },
    cls: 'x-test-logger',
    disableSelection: true,
    trackMouseOver: false,
    initComponent: function() {
        this.configureStore();
        this.configureColumns();
        this.monitorTestRunner();
        Ext.test.view.Logger.superclass.initComponent.apply(this, arguments);
    },
    // store config
    configureStore: function(){
        this.store = new Ext.data.JsonStore({
            fields: ['logs', 'state']
        });
    },
    // default column and his renderer
    configureColumns: function(){
        this.columns = [{
            header: 'Logs',
            dataIndex: 'logs',
            renderer: function(value, cell, record) {
                return '<span class="x-test-logger-state-' + record.get('state') + '">' + value + '</span>';
            }
        }];
    },
    // monitor test runner events
    monitorTestRunner: function(){
        var fn = this.onTestRunnerEvent;
        var r = Ext.test.Runner;
        this.mon(r, 'begin', fn, this);
        this.mon(r, 'complete', fn, this);
        this.mon(r, 'fail', fn, this);
        this.mon(r, 'pass', fn, this);
        this.mon(r, 'ignore', fn, this);
        this.mon(r, 'testcasebegin', fn, this);
        this.mon(r, 'testcasecomplete', fn, this);
        this.mon(r, 'testsuitebegin', fn, this);
        this.mon(r, 'testsuitecomplete', fn, this);
    },
    // add records on each runner events
    onTestRunnerEvent: function(r, e) {
        var logs;
        switch (e.type) {
        case 'begin':
            logs = "Begin at " + new Date();
            break;
        case 'complete':
            logs = "Completed at " + new Date();
            break;
        case 'testcasebegin':
            logs = 'TestCase ' + e.testCase.name + ' : Begin.';
            break;
        case 'testcasecomplete':
            logs = 'TestCase ' + e.testCase.name + ' : Complete.';
            break;
        case 'testsuitebegin':
            logs = 'TestSuite ' + e.testSuite.name + ' : Begin.';
            break;
        case 'testsuitecomplete':
            logs = 'TestSuite ' + e.testSuite.name + ' : Complete.';
            break;
        case 'pass':
            logs = e.testName + ' : Passed.';
            break;
        case 'fail':
            logs = e.testName + ' : Failed! <br />' + e.error.toString();
            break;
        case 'ignore':
            logs = e.testName + ' : Ignored.';
            break;
        }
        if (logs) {
            this.store.add(new Ext.data.Record({
                logs: logs,
                state: e.type
            }));
        }
    }
});
Ext.reg('testlogger', Ext.test.view.Logger);
