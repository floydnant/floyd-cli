const fs = require('fs')
const path = require('path')
require('dotenv/config')

const env = {
    VERSION: process.env.npm_package_version ?? require('../../../package.json').version ?? 'x.x.x',
    // HARVEST_API_TOKEN: process.env.HARVEST_API_TOKEN,
    // HARVEST_ACCOUNT_ID: process.env.HARVEST_ACCOUNT_ID,
}

fs.writeFileSync(path.join(__dirname, '../env.json'), JSON.stringify(env, null, 4))
