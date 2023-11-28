const {Sequelize} = require('sequelize')
const {Client} = require('pg')
const Op = Sequelize.Op;
const  dbConfig = require('./db-config.json')
const dbName = dbConfig.postgre.db;
const userName = dbConfig.postgre.username;
const password = dbConfig.postgre.password;
const host = dbConfig.postgre.host
const port = dbConfig.postgre.port
const dialect = 'postgres'


async function getContext(){
    const sequelize = new Sequelize(dbName, userName, password, {
        host: host,
        port: port,
        dialect: dialect,
        pool: {
            max: 15,
            min: 5,
            idle: 20000,
            evict: 15000,
            acquire: 30000
        },
        ssl: true,
        define: {
            timestamps: false
        }
    })
    const Staff = sequelize.define("staff", {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: false,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
    });
    const Group = sequelize.define("group", {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: false,
            primaryKey: true,
            allowNull: false
        },
        number: {
            type: Sequelize.STRING,
            allowNull: false
        },
    });
    return { sequelize, Staff, Group }
}

async function createDb(){
    var client = new Client({ user: userName, host: host, database: 'postgres', password: password, port: port, });
    try { 
        await client.connect(); 
        console.log('Connected to PostgreSQL database!')
        await client.query('CREATE DATABASE ' + dbName)
        .catch(() => console.log('database already exist or you do not have sufficient access rights'))
        await client.end()
    }catch (err) 
    {
        console.error('Error connecting to the database:', err); 
    }    
}

module.exports = {
    getContext: getContext,
    createDb: createDb,
    Op: Op
};