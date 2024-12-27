# Deprecated

This project is essentially deprecated in favor of ES6 (ES2015) classes. I recommend using
[Babel](https://babeljs.io/) for pure JS, or [TypeScript](https://www.typescriptlang.org/) 
to create to create classes from now on.


# Class.js

Add class(es) to your JavaScript! 

JavaScript doesn't make it easy or straightforward to implement classical inheritance in the language, so that's what this utility is for. Using this utility, and OOP in general, allows you to more easily write reusable, extensible, maintainable, and testable code, which is fundamental for writing and maintaining large software systems.

This small utility allows you to:

- Create classes in JavaScript (where JavaScript doesn't actually have a formal notion of a "class"), easily setting up instance properties / methods.
- Singly-inherit from other classes (just like Java, C#, or most other OOP languages do), and easily call superclass constructors/methods from overridden methods in subclasses.
- Declare abstract classes / methods.
- Add mixin classes as a form of multiple inheritance, or the ability to implement interfaces.
- Add static methods which are optionally inherited by subclasses.
- Add a special static method (onClassCreated) which allows for the static initialization of the class itself (much like a static initializer does in Java).


## Creating and Extending a Class

### Creating a Class

A class may be created in one of two ways (both are equivalent):

```javascript
var Car = Class.create({
    constructor: function() {
        // constructor logic goes here
    }
});
```

or

```javascript
var Car = Class.extend(Object, {
    constructor: function() {
        // constructor logic goes here
    }
});
```

Specifying a `constructor` function is optional. If one is not provided, a default constructor that simply calls the superclass's constructor is used instead. The default constructor passes all arguments to the superclass's constructor as well.


### Adding Properties / Methods

The object that you provide to `Class.create()` or `Class.extend()` is the "class definition". Properties specified on this object (with the exception of the special property `constructor` and a few others which we will see later) are placed on the constructor function's (i.e. class's) prototype. This is where instance methods, and defaults for fields (instance-level properties) should be placed. Ex:

```javascript
var Cat = Class.create({
    // An instance-level property which defaults to an empty string.
    name: "",
    
    // The class's constructor
    constructor: function(name) {
        if(name) {   // if a name was provided to the constructor, set it
            this.setName(name);
        }
    },
    
    // Mutator to set the `name` property
    setName: function(name) {
        this.name = name;
    },
    
    // Accessor to retrieve the `name` property
    getName: function() {
        return this.name;
    }
});
``` 


### Extending classes

Classes can be extended (i.e. can inherit from) from other classes. This can be done in one of two ways (which are equivalent).

1) Using `Class.extend()`

```javascript
var Animal = Class.create({
    sayHi: function() {
        alert("Hi from Animal");
    }
});

var Cat = Class.extend(Animal, {
    meow: function() {
        alert("Meow from Cat");
    }
});

var cat = new Cat();
cat.sayHi();  // "Hi from Animal"
cat.meow();   // "Meow from Cat"
```

2) Using the static `extend` method which is placed on all classes created using `Class.create()` or `Class.extend()`

```javascript
var Animal = Class.create({
    sayHi: function() {
        alert("Hi from Animal");
    }
});

var Cat = Animal.extend({
    meow: function() {
        alert("Meow from Cat");
    }
});

var cat = new Cat();
cat.sayHi();  // "Hi from Animal"
cat.meow();   // "Meow from Cat"
```


### Calling Superclass Methods

Superclass methods can be called easily by using `this._super()`. `this._super()` takes an *array* of arguments to pass to the superclass method. It is done this way because most often, you will simply be passing up the `arguments` object to the superclass method. Ex:

```javascript
var BaseClass = Class.create({
    constructor: function(a, b, c) {
        alert("Constructing BaseClass with arguments: " + a + " " + b + " " + c);
    }
});

var SubClass = BaseClass.extend({
    constructor: function(a, b, c) {
        // Call the superclass's constructor, passing up all of the arguments
        this._super(arguments);
        
        // Just another alert to show that the subclass is being constructed as well
        alert("Constructing SubClass");
    }
});


var instance = new SubClass(1, 2, 3);
```


However, if you want to call the superclass method with specific arguments, simply pass them in an array. Ex:

```javascript
var BaseClass = Class.create({
    myMethod: function(a, b, c) {
        for(var i = 0, len = arguments.length; i < len; i++) {
            alert("BaseClass myMethod received arg: " + arguments[ i ]);
        }
    }
});

var SubClass = BaseClass.extend({
    myMethod: function(a, b, c, d) {
        // The subclass accepts an extra argument, d, which we don't want to pass to the superclass's myMethod in this case
        this._super([ a, b, c ]);
        
        // Handle argument `d`
        alert("SubClass myMethod handled d (arg #4) as: " + d);
    }
});


var instance = new SubClass();
instance.myMethod(1, 2, 3, 4);
```

As you can see from the examples above, `this._super()` works both in the constructor, and all instance methods.


### Putting it all together

With the traditional example of animals...

```javascript
var Animal = Class.create({
    // The class's constructor. The property `constructor` is treated as a special property, which 
    // is the function that is executed when an instance is created
    constructor: function(name) {
        this.name = name;
    },
    
    // An instance method
    sayHi: function() {
        alert("Hi, my name is: " + this.name);
    },
    
    // Another instance method
    eat: function() {
        alert(this.name + " is eating");
    }
});


var Dog = Animal.extend({
    constructor: function() {
        // Call the superclass's constructor first
        this._super(arguments);
        
        alert("Constructing a dog");
    },

    // Override sayHi method from superclass
    sayHi: function() {
        alert("Woof! My name is: " + this.name);
    }
});

var Cat = Animal.extend({
    constructor: function() {
        // Call superclass's constructor first
        this._super(arguments);
        
        alert("Constructing a cat");
    },
    
    // Override sayHi instance method from superclass
    sayHi: function() {
        alert("Meow! My name is: " + this.name);
    }
});


var dog1 = new Dog("Lassie");
var dog2 = new Dog("Bolt");
var cat = new Cat("Leonardo Di Fishy");

dog1.sayHi();  // "Woof! My name is: Lassie"
dog2.sayHi();  // "Woof! My name is: Bolt"
cat.sayHi();   // "Meow! My name is: Leonardo Di Fishy"

dog1.eat();  // "Lassie is eating"
dog2.eat();  // "Bolt is eating"
cat.eat();   // "Leonardo Di Fishy is eating"
```



### Extending classes from other frameworks

Because this implementation does not rely on making `Class` the superclass of all classes, Class.js can also be used to extend classes from other frameworks using `Class.extend()` (if those classes rely on prototype-chained inheritance behind the scenes, as Class.js does). This allows you to add Class.js features (mixins, inherited static properties, etc) to new subclasses of another hierarchy. Ex:

```javascript
var MySubClass = Class.extend(SomeOtherFrameworksClass, {
    mixins: [ SomeMixinClass ],
    
    inheritedStatics: {
        someInheritedStaticMethod: function() {}
    },
    
    
    constructor: function() {
        // Call our mixin's constructor before calling the superclass's constructor
        SomeMixinClass.call(this);  // Call the constructor function with this object as the context
        
        this._super(arguments);
    }
    
    
    anExtraInstanceMethod: function() {}    
});
```

For those of you familiar with [Backbone.js](http://documentcloud.github.com/backbone/), instead of following the usual method of extending a Backbone class (like `Backbone.Model`), you could use `Class.extend()` to add the features of Class.js to extend it instead. The following example shows how to do so to gain access to `this._super()`:

```javascript
var MyModel = Class.extend(Backbone.Model, {
    
    // Override the set() method to do some pre-processing
    set: function(attrs) {
        // Could do some preprocessing of some sort here... 
        // but just log the attrs for this example
        console.log(attrs);
        
        // Then call the superclass method
        return this._super(arguments);
    }
    
});
```



## Static and Inherited Static Properties/Methods

Class.js allows you to define static methods within the class definition itself (which makes for easier to read / understand code over some other inheritance implementations, which force you to add static methods only after your subclass has been defined). 

There are two ways to define static methods/properties: 

1. As a static of only the class itself (using `statics`), and 
2. As a static that is inherited to subclasses as well (using `inheritedStatics`)

###### Note that properties that are *primitives* (i.e. strings, numbers, and booleans) cannot be simply "inherited" (shared) by subclasses as the same property from the superclass. Because of their nature in JavaScript, these properties are *copied* to subclasses, not shared by them. Keep this in mind when creating static methods that use static properties, to always reference the "shared" static properties from the correct superclass (i.e. the superclass that defined them).

Ex:

```javascript
var Animal = Class.create({
    
    // static properties/methods that will be applied to to the Animal class *only* (not subclasses)
    statics: {
        
        // A static factory method for the Animal class. This static method
        // will not be inherited into subclasses
        createByType: function(type, animalName) {
            if(type === 'dog') {
                return new Dog(animalName);
            } else if(type === 'cat') {
                return new Cat(animalName);
            } else {
                throw new Error("Unknown Animal type '" + type + "'");                
            }
        }
    },
    
    
    // static properties/methods that will be included in all subclasses of this class as well
    inheritedStatics: {
        
        // A pretend method that loads a given animal / cat / dog by id from a server
        load: function(animalId) {
            // For example purposes, assume some synchronous ajax request is made here for data (although
            // you should never *really* use a synchronous ajax request; use an asynchronous one instead and
            // have your users provide a callback function)
            var data = { animalName: "Kitty Kitty Woof Woof" };

            // Note: the `this` reference inside of a static method refers to the class / subclass
            // that the method is being called from. If called from Cat, `this` refers to Cat. If 
            // called from Dog, `this` refers to Dog.
            return new this(data.animalName);
        }
        
    },
    
    
    // ---------------------
    
    // Constructor and instance methods
    
    
    constructor: function(name) {
        this.name = name;
    },
    
    sayHi: function() {
        alert("Hi, my name is: " + this.name);
    }
});


// Concrete classes (which simply use the definition of the Animal class, and inherit the static 'load' method)
var Cat = Animal.extend({});
var Dog = Animal.extend({});


// ---------------------------------------


// Use of the static method that exists only on the Animal class (not subclasses)
var myCat = Animal.createByType('cat', "Milo");   // instantiate a Cat object using the static factory method
console.log(myCat instanceof Cat);     // true

// Use of static method that is inherited by subclasses
var firstCat = Cat.load(1);  // load the "first cat" from our "server". Instantiates a Cat object
var firstDog = Dog.load(1);  // load the "first dog" from our "server". Instantiates a Dog object

console.log(firstCat instanceof Cat);  // true
console.log(firstDog instanceof Dog);  // true

```


## Adding Mixins

Although I recommend that you keep multiple inheritance to a minimum (as it increases complexity -- use composition as much as possible instead), there are a few cases where you do want to share some code where that code wouldn't make sense to be a part of your normal inheritance hierarchy as a base class. But also, mixins allows you to implement interfaces as well.

An example of implementing an interface:

```javascript
// The interface
var List = Class.create({
    add: function() { throw new Error("add() must be implemented in subclass"); },
    remove: function() { throw new Error("remove() must be implemented in subclass"); } 
});


// A class implementing the interface
var CoolList = Class.create({
    mixins: [ List ],  // "implements" List
    
    constructor: function() {
        this.items = [];
    },
    
    add: function(item) {
        this.items.push(item);
    }
    
    // Whoops! I forgot to implement remove() !
});


var myList = new CoolList();
myList.add("item1");     // succeeds
myList.remove("item1");  // ERROR: "remove() must be implemented in subclass"
```


Our interface could have been implemented using the generalized "abstractMethod" convenience function provided with Class.js as well:

```javascript
// The interface
var List = Class.create({
    add: Class.abstractMethod,
    remove: Class.abstractMethod
});
```


Here's an example of using a mixin with actual functionality, which adds event-based Observable functionality to the class:

```javascript
// A mixin that can add very simple events functionality to a class (if anyone wants this for real real, I'll make a github for it)
var Observable = Class.create({
    
    constructor: function() {
        this.events = {};
    },
    
    
    addListener: function(eventName, fn, scope) {
        if(!this.events[ eventName ]) {
            this.events[ eventName ] = [];  // create an array for the listeners
        }
        
        var listener = {
            fn: fn, 
            scope: scope || window   // default to firing events in the window scope, if the scope arg is not provided
        };
        this.events[ eventName ].push(listener);
    },
    
    
    removeListener: function(eventName, fn, scope) {
        var listeners = this.events[ eventName ],
            i, len;
        
        // No subscribers, simply return
        if(!listeners || listeners.length === 0) {
            return;
        }
        
        scope = scope || window;
        for(i = 0, len = listeners.length; i < len; i++) {
            if(listeners[ i ].fn === fn && listeners[ i ].scope === scope) {
                listeners.splice(i, 1);  // remove the listener entry
                break;
            }
        }
    },
    
    
    fireEvent: function(eventName /* all other args are provided to the listeners' handler functions */) {
        var listeners = this.events[ eventName ],
            i, len;
        
        // No subscribed listeners, simply return
        if(!listeners || listeners.length === 0) {
            return;
        }
        
        var eventArgs = Array.prototype.slice.call(arguments, 1);  // grab all args provided to fireEvent except the event name, to provide to handlers
        for(i = 0, len = listeners.length; i < len; i++) {
            listeners[ i ].fn.apply(listeners[ i ].scope, eventArgs);
        }
    }
    
});


// A class that uses the mixin
var Duck = Class.create({
    
    mixins: [ Observable ],
    
    constructor: function(name) {
        // Don't forget to call the mixin's constructor for proper initialization!
        // Unfortunately, this has to be done by directly using the mixin class's constructor function, setting the proper context object (this)
        Observable.call(this);
        
        this.name = name;
    },
    
    quack: function() {
        this.fireEvent('quack', this);  // provide this Duck object with the event
    },
    
    getName: function() {
        return this.name;
    }
    
});


var duck = new Duck("Milo");

// Observe the duck's quacking
duck.addListener('quack', function(duck) {
    alert("The duck '" + duck.getName() + "' has quacked.");
});

duck.quack();   // will trigger (fire) the event
```

Notice how `Duck` inherited the methods from the mixin. However, if the class that is being created already defines a method that the mixin also defines,
the **class's method overrides it**. In this case, you must manually call the mixin's method, if you want it to be called (i.e. you wanted to "extend" the mixin's method, not completely *override* it with your new class's definition). Following from the example from above:

```javascript
var Duck = Class.create({
    mixins: [ Observable ],
    
    constructor: function(name) {
        // Don't forget to call the mixin's constructor!
        Observable.call(this);
        
        this.name = name;
    },
    
    quack: function() {
        this.fireEvent('quack', this);  // provide this Duck object with the event
    },
    
    // Override fireEvent (for whatever reason...), calling the mixin's fireEvent at the end
    fireEvent: function() {
        alert("just a note: fireEvent() has been called!");
        
        // Call the method from the mixin now.
        // Instance methods are located on the prototype (as with any prototype chained implementation), and we must
        // call it in the correct scope (`this`).
        Observable.prototype.fireEvent.apply(this, arguments);
    }
    
});
```

One last note: if the class includes multiple mixins that all define the same property/method, the mixins defined later in the `mixins` array take precedence.


## Abstract Classes / Methods

### Abstract Classes

A class may be declared with the special boolean property `abstractClass` on its prototype, to prevent direct instantiation of the class. This enforces that a concrete subclass must be created to implement the abstract class's interface. 

(Note: Unfortunately, a property name other than the word `abstract` had to be used, as `abstract` is a reserved word in JavaScript). 

For example:

```javascript

// An abstract class which serves as the base class of Car and Truck
var Vehicle = Class.create({
    abstractClass: true,
    
    constructor: function(make, model) {
        this.make = make;
        this.model = model;
    },
    
    // *** An abstract method -- must be implemented in subclass
    getMaxSpeed: Class.abstractMethod
});


// Concrete class
var Car = Vehicle.extend({
    getMaxSpeed: function() { return 130; }
});

// Concrete class
var Truck = Vehicle.extend({
    getMaxSpeed: function() { return 80; }
});


// Attempt to instantiate a Vehicle directly
var vehicle = new Vehicle('Chevy', 'P.O.S.');   // error! Cannot instantiate abstract class

// Now concrete vehicle types
var car = new Car('Honda', 'Accord');
alert(car.getMaxSpeed());  // 130

var truck = new Truck('Ford', 'F150');
alert(truck.getMaxSpeed());  // 80

```


### Abstract Methods

To declare a method as abstract, set it to the function referred to by `Class.abstractMethod`. This allows for "compile time" (i.e. class creation time) checking that concrete classes implement all abstract methods from their abstract base class(es). It also allows for a warning for when a class is defined as having abstract methods, but is not declared with `abstractClass: true`.

Ex:

```javascript

var Appliance = Class.create({
    abstractClass: true,  // this must be set for a class which has an abstract method
    
    turnOn: Class.abstractMethod,
    turnOff: Class.abstractMethod
});


var Oven = Appliance.extend({
    turnOn: function() { 
        // ... 
    },
    turnOff: function() { 
        // ... 
    },
    
    someOtherMethod: function() {}
});

```

However, if we forget to implement an abstract method, we get an error right off the bat reminding us to do so (as opposed to only getting an error when the abstract method is called):

```javascript

var Appliance = Class.create({
    abstractClass: true,  // this must be set for a class which has an abstract method
    
    turnOn: Class.abstractMethod,
    turnOff: Class.abstractMethod
});


// Errors because this class forgets to implement the `turnOff` method, and is not declared as abstract itself
var Oven = Appliance.extend({
    turnOn: function() { 
        // ... 
    },
    // Whoops! Forgot to implement the `turnOff` method. Throws Error.
    
    someOtherMethod: function() {}
});

```



## onClassCreated (a static initializer)

This is a special method that may be defined under the `statics` or `inheritedStatics` section, which is executed when the class 
is finished being created (i.e. its prototype / inheritance chain has been set up, its mixins have been set up, etc). This can be 
used as a static initializer for the class, which you may use to set up the class itself (if there is anything to do at this time). 
Although rarely used, it is very useful for setting up static properties for an entire hierarchy of subclasses (when the 
`onClassCreated` method exists under `inheritedStatics`).

As a very simple example, we could assign a unique id for each *class* itself (not instances) in an inheritance heirarchy, including 
the class that it was originally defined on.

```javascript
var counter = 0;


var MyBaseClass = Class.create({

    inheritedStatics: {
        onClassCreated: function(newClass) {
            // newClass is the class that was just created. We can't yet reference it as MyBaseClass 
            // until the Class.create() function returns. It will also apply to subclasses as well.
            
            // Attach a static, unique id to this class, and each subclass extended from this one
            newClass.uniqueId = ++counter;  // `counter` defined above
        }
    }
    
});


// empty subclass definition, but onClassCreated() still executes after it is created
// because it was defined under the `inheritedStatics` section
var MySubClass = MyBaseClass.extend({});  

alert(MyBaseClass.uniqueId); // alerts: 1
alert(MySubClass.uniqueId);  // alerts: 2
```



## Usage from Node.js

Unfortunately, the "class-js" package name was taken, so I made it "class-js2"

```
npm install class-js2 --save
```

```javascript
var Class = require('class-js2');

var HelloWorld = Class.create(...);
//...
```


## Changelog:

### 0.5.0

* Move distribution files into `dist/` folder.

### 0.4.0

* Remove `Class()` as a function which internally called `Class.create()`. This wouldn't pass JSHint validation when
  used (JSHint expects the `new` operator for a capitalized var), and `Class.create()` is clearer anyway. 

### 0.3.3
* Change `onClassExtended` to `onClassCreated` (leaving the old one for backward compatability)

### 0.3.2
* Add optional define() call for AMD loaders.

### 0.3.1

* Fixed the 'superclassMethodCallRegex' in the extend() method to work correctly when Class.js is minified, and the variable name inside the "check's" function is rewritten.
* Fixed extend() to not wrap constructor functions of another class (which may be placed on a prototype) with a this._super() calling method.

### 0.3

* Added `Class.isSubclassOf` method, for statically testing if a class is a subclass of another (without creating instances).

### 0.2.2

* A little code cleanup.

### 0.2.1

* Implemented the ability to declare abstract methods, and enforce that they are implemented in concrete subclasses. 

### 0.2

* Implemented the ability to declare abstract classes. 

### 0.1.3.1

* Implemented workaround for `this._super()` calling method in constructor functions for Internet Explorer. Apparently a property named `constructor` is not enumerable using a for-in loop in IE...

### 0.1.3

* Added the ability to call the superclass method simply by using this._super(). 

### 0.1.2

* Added ability to include a special static (or inherited static) onClassExtended() method, which is passed the new class
  that is being created, and allows for subclass-specific initialization (such as to provide the same functionality as a 
  static initializer in Java). 

### 0.1.1

* Fix to allow superclass constructors to return an object other than the usual `this` object.

### 0.1.0

* Initial implementation
