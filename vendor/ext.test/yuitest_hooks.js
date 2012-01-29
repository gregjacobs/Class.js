// Current ExtJs Unit Test are based on YUI 3.1.1
// Thanks to Niko for this
/*global YUI */
var Y = {};
Y.ObjectAssert = {};

YUI().use('*', function(A) {
	// Some hooks
	Y = A;
	Y.ObjectAssert.hasProperty = Y.ObjectAssert.hasKey;
});
