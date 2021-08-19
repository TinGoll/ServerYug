const firebird = require('node-firebird')
const {options} = require('../../config/.firebirdDB/settingsDB')
const pool = firebird.pool(5, options)
const {queryAllPackages, queryOnePackages} = require('../query/packages')

const getAllPackages = (req, res) => {
    
};

const getOnePackages = (req, res) => {

};

module.exports = {
    getAllPackages,
    getOnePackages
}