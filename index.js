const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { validate_env_variables } = require('./bot_config');
validate_env_variables();

require('./app');
