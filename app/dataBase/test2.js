
const db                        = require('../dataBase');

const jfunction                 = require('../systems/virtualJournalsFun');

/*
const _ = require ('lodash');
var array = [
   {name: 'Коля', t: 10},
   {name: 'Петя', t: 10},
   {name: 'Коля', t: 11},
   {name: 'Коля', t: 10},
]

const arr = _.uniqWith(array, _.isEqual);



*/
const journal = jfunction.getJournalToId(1).then(r => {
   console.log(r);
});


//console.log(arr);


