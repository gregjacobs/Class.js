Class.js

## Changelog:

### 0.1.2

* Added ability to include a special static (or inherited static) onClassExtended() method, which is passed the new class
  that is being created, and allows for subclass-specific initialization (such as to provide the same functionality as a 
  static initializer in Java). 

### 0.1.1

* Fix to allow superclass constructors to return an object other than the usual `this` object.

### 0.1.0

* Initial implementation
