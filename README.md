# Data shaper

[![Build Status](http://img.shields.io/travis/vgno/data-shaper/master.svg?style=flat-square)](https://travis-ci.org/vgno/data-shaper)[![Coverage Status](http://img.shields.io/codeclimate/coverage/github/vgno/data-shaper.svg?style=flat-square)](https://codeclimate.com/github/vgno/data-shaper)[![Code Climate](http://img.shields.io/codeclimate/github/vgno/data-shaper.svg?style=flat-square)](https://codeclimate.com/github/vgno/data-shaper)

The data shaper is a utility for shaping data and resolving related objects and data from normalized, relational data. Through shapes the relation between different parts of the response is declared, and a flat, keyed response is created based on the response objects and collections you've declared.

### Why?
While normalized datastructures usually is a good idea it does not always translate so good to what you want to present to a client side app or a 3rd party consumer. The problem is in many cases solved creating lots of custom endpoints, which is not trivial to maintain.

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
    collectionName: 'companies',
    shape: {
        id: 'id',
        name: 'name'
    }
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
    persons: { '1' : { id: 1, name: 'Kristoffer', company: { companies: 2 } } },
    companies: { '2' : { id: 2, name: 'VG' } }
}
```

--------------------

## References
References to values on the passed objects themselves is written as a simple string, like `name`. Values referencing properties on related data use dot notation.

If have a field `companyId` on the object and want to get the name of the company you can use `companyId.name` given that name is a property on the company data object.

## Reverse references
In some cases data is referred to using coupling tables in order to make it possible to represent one-to-many or many-to-many relationships. The data shaper lets you express these relations using a reverse reference lookup.

It looks like this; `collectionName(collectionField=referencedField)` and when the resolver finds a reference like this it does the following:

1. Extracts the data from the reference: collection name, referring and referenced field
2. Find the value to use when looking up data in the collection by fetching the value of `referencedField` from the object where the reference is
3. Pass the collection, referring field and referenced value to the `fetchData` function

This will result in an array of all matches being returned in the shape.

## Single, direct, reverse reference

In some cases, you might have a single, direct reverse reference. For instance, assume you have the following collection structure (imagine the `catBreedId` can only contain unique values):

### catBreeds

| id | name                 | description              |
|----|----------------------|--------------------------|
| 1  | Norwegian Forest Cat | the most awesome of cats |
| 2  | Scottish fold        | the cutest of cats       |

### translations

| id | catBreedId | translatedName  |
|----|------------|-----------------|
| 11 | 1          | Norsk skogkatt  |
| 12 | 2          | Skotsk kattepus |

Should you want to retrieve the translation for a given `catBreed`, you can do so by specifying a reverse, direct reference. It uses the same syntax as defined above, except it uses a double equation sign (`==`). For instance, the shape could be represented as:

```js
{
    collectionName: 'catBreeds',
    shape: {
        id: 'id',
        name: 'name',
        translated: {
            reference: 'translations(catBreedId==id)',
            shape: {
                collectionName: 'translations',
                shape: {
                    id: 'id',
                    translatedName: 'translatedName'
                }
            }
        }
    }
}
```

The difference here is that the shape will return a single ID for the reference, in the same way as regular references are shaped.

## Complex reverse references
Sometimes there is a need for filtering the data, for instance if the reverse lookup returns translations for multiple languages and you only need the norwegian translation. Filtering of data can be done by specifying multiple field-value pairs; ```translations(catBreedId=id, language="no-NB")```.

## Fetching data
In order for the data shaper to be able to resolve data you need to name your foreign keys in a way so that you're able to know what to query. The resolver pass the id and reference to the `fetchData` function you provide to the data-shaper. You will then have to use the reference to determine where the data is to be fetched from, get the data and return it.

Your fetchData function may look like this
```js
var db = require('your-database-adapter');

/**
 * Function fetching and returning data.
 *
 * If value is not an object the reference is a foreign key and the data can usually be fetched
 * by primary key on the referred table. If however the value is an object, we're doing a reverse
 * lookup and the value contains the data to filter by.
 *
 * The value looks like this when doing revers referencing: { fieldA: 'valueA', fieldB: 123 }
 *
 * In both cases a full object with all relevant data for the collection is expected.
 *
 * @param {object|int} Value to use when looking up data
 * @param {string} reference One of two types; someOtherId (foreign key) or collection (for reverse reference)
 * @param {function} callback
 */
function fetchData(value, reference, callback) {
    if (typeof value === 'object') {
        var collection = reference;
        var query = value;

        db(collection)
            .where(query)
            .then(function(res) {
                callback(null, res)
            })
            .catch(callback);

        return;
    }

    // Remove Id suffix from foreign key name to get collection name
    var collection = reference.replace(/Id$/, '');

    // Fetch the data
    db(collection).fetch(id, callback);
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
