# Data shaper

[![Build Status](http://img.shields.io/travis/vgno/data-shaper/master.svg?style=flat-square)](https://travis-ci.org/vgno/data-shaper)[![Coverage Status](http://img.shields.io/codeclimate/coverage/github/vgno/data-shaper.svg?style=flat-square)](https://codeclimate.com/github/vgno/data-shaper)[![Code Climate](http://img.shields.io/codeclimate/github/vgno/data-shaper.svg?style=flat-square)](https://codeclimate.com/github/vgno/data-shaper)

The data shaper is a utility for shaping data and resolving related objects and data from normalized, relational data. Through shapes the relation between different parts of the response is declared, and a flat, keyed response is created based on the response objects and collections you've declared.

### Why?
While normalized datastructures usually is a good idea it does not always translate so good to what you want to present to a client side app or a 3rd party consumer. The problem is in many cases solved creating lots of custom, which is not trivial to maintain.

### How?
Through the declaration of shapes and references to related data you have a fairly flexible and very maintainable way of building responses spanning across multiple collections of data.

# Installation
```sh
npm install --save data-shaper
```

# Basic usage
```js
var dataShaper = require('data-shaper');

// For the sake of this example the fetchData returns some mock data
function fetchData(id, reference, callback) {
    process.nextTick(function() {
        callback(null, { id: 2, name: 'VG' });
    });
}

var companyShape = {
    id: 'id',
    name: 'name'
};

var personShape = {
    id: 'id',
    name: 'name',
    company: {
        reference: 'companyId',
        shape: companyShape
    }
};

dataShaper(
    { id: 1, name: 'Kristoffer', companyId: 2 }, // data to shape
    personShape, // the shape to use
    { fetchData: fetchData }, // dataShaper params
    function(err, res) {
        // do stuff with res here
    }
);
```

The value of res in the callback is:

```js
{
    persons: { '1' : { id: 1, name: 'Kristoffer', employer: { employers: 1 } } },
    employers: { '2' : { id: 2, name: 'VG' } }
}
```

--------------------

## References
References to values on the passed objects themselves is written as a simple string, like `name`. Values referencing properties on related data use dot notation.

If have a field `companyId` on the object and want to get the name of the company you can use `companyId.name` given that name is a property on the company data object.

## Fetching data
In order for the data shaper to be able to resolve data you need to name your foreign keys in a way so that you're able to know what to query. The resolver pass the id and reference to the `fetchData` function you provide to the data-shaper. You will then have to use the reference to determine where the data is to be fetched from, get the data and return it.

Your fetchData function may look like this
```js
var db = require('your-database-adapter');

function fetchData(id, reference, callback) {
    var tableName = reference.replace(/Id$/, '');

    db(tableName).fetch(id, callback);
}
```

The data fetcher method is memoized within a `dataShaper` call by default to speed up fetches, but you have the option of disabling this by passing `memoize: false` in the options object. Note that the memoization is local only – it won't cache anything across separate calls on the `dataShaper` function. If you want caching across calls you have to implement that yourself in the `fetchData` function.

## Shapes
Shapes look this:

```js
var simpleShape = {
    collectionName: 'persons',
    shape: {
        id: 'id',
        name: 'name',
        employerId: 'companyId'
    }
};
```

With this shape, all objects passed to the data shaper will be represented with an object looking like this shape, with the values being fetched from the passed objects.

```js
// This data object
{ id: 1, name: 'Kristoffer', city: 'Oslo', companyId: 5 }

// ...results in a response object like this
{ id: 1, name: 'Kristoffer', employerId: 5 }
```

A more complex shape, including a relation reference looks like this;

```js
var employersShape = {
    collectionName: 'companies',
    shape: {
        id: 'id',
        name: 'name'
    }
};

var personShape = {
    collectionName: 'persons',
    shape: {
        id: 'id',
        name: 'name',
        employer: {
            reference: 'companyId',
            shape: employerShape
        }
    }
};
```

When shaping a person object using the `personShape` the `fetchData` method you provide is used to resolve the data for the company. In the `personShape` company is declared using an object with a reference and a shape – a `fragment`.

# License
MIT licensed. See LICENSE.
