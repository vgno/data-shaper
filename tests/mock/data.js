'use strict';

var persons = {
    '1': {
        id: 1,
        firstName: 'Fred',
        lastName: 'Flintstone',
        age: 36,
        zipId: 1234,
        companyId: 2
    },
    '2': {
        id: 2,
        firstName: 'Barney',
        lastName: 'Rubble',
        age: 32,
        zipId: 1234,
        companyId: 3
    }
};

var companies = {
    '2': { id: 2, name: 'VG', municipalId: 1 },
    '3': { id: 3, name: 'VaffelNinja', municipalId: 1 }
};

var addresses = {
    '1': {
        id: 1,
        personId: 1,
        address: 'Alphabet st. 1',
        zipId: 1234,
        country: 1
    },
    '2': {
        id: 2,
        personId: 1,
        address: 'Number rd. 2',
        zipId: 1234,
        country: 1
    }
};

var phoneNumbers = {
    '1': { id: 1, employeeId: 1, phoneTypeId: 1, number: 98765432 },
    '2': { id: 2, employeeId: 1, phoneTypeId: 2, number: 23456789 },
    '3': { id: 3, employeeId: 2, phoneTypeId: 1, number: 99999999 },
    '4': { id: 4, employeeId: 1, phoneTypeId: 1, number: 98989898 }
};

var phoneTypes = {
    '1': { id: 1, name: 'Mobile' },
    '2': { id: 2, name: 'Landline' }
};

var zips = {
    '1234': { id: 1234, countryId: 1 }
};

var municipals = {
    '1': { id: 1, name: 'Oslo', countryId: 1 },
    '2': { id: 2, name: 'Lørenskog', countryId: 1 }
};

var countries = {
    '1': { id: 1, name: 'Norway' }
};

module.exports = {
    persons: persons,
    addresses: addresses,
    phoneNumbers: phoneNumbers,
    phoneTypes: phoneTypes,
    countries: countries,
    zips: zips,
    municipals: municipals,
    companies: companies
};
