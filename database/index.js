const Promise = require('bluebird');
const db = Promise.promisifyAll(require('mysql2'));
const bcrypt = Promise.promisifyAll(require('bcrypt'));
const schemaConstructor = require('./schema');

if(process.env.NODE_ENV !== "production") {
	require('dotenv').config();
}

const connection = db.createConnection(process.env.MARIADB_URL || require('../connectionSQL'));

schemaConstructor(connection);

setInterval(function () {
    connection.query('SELECT 1');
}, 5000);

// =================================================================
// AUTHENTICATION METHODS
// =================================================================

module.exports.signUp = async (username, password, email) => {
  let users = await connection.queryAsync(`
		SELECT * FROM Users
		WHERE username = ? OR email = ?
  	`, [username, email]);
  
  const user = users[0];

  if(!users[0]) {
  	await connection.queryAsync(`
  		INSERT INTO Users (username, password, email)
  		VALUES(?, ?, ?)
  	`, [username, password, email]);

  	return false;
  } 


  if(user.username === username) {
  	return { error: 'That username exists' };
  } else {
  	return { error: 'That email exists' };
  }

  connection.end();
};


module.exports.findOne = async (username, callback) => {
	try {
	  let users = await connection.queryAsync(`
		SELECT * FROM Users
		WHERE username = ?
		`, username);

		callback(null, users[0]);
	} catch(err) {
		callback(err, null);
	}

  connection.end();
};

module.exports.verifyPassword = async password => {
  return await bcrypt.compareAsync(password, user.password);

  connection.end();
};
module.exports.login = async (username, password) => {
  let users = await connection.queryAsync(`
		SELECT * FROM Users
		WHERE username = ?
  	`, username);
  
  const user = users[0]; 

  if(user) {
  	const compare = await bcrypt.compareAsync(password, user.password);
  	
  	if(compare) {
  		return false;
  	}

  	return { error: 'Invalid credentials' };
  } else {
  	return { error: 'user does not exist' };
  }

  connection.end();
};

// =================================================================
// POLLING METHODS
// =================================================================

module.exports.createPoll = async (username, title, choices) => {

  const { insertId } = await connection.queryAsync(`
    INSERT INTO Poll (name, user_id)
    VALUES(?, (SELECT id FROM Users WHERE username = ?))
  `, [title, username]);

  await Promise.all(choices.map(choice => {
    return connection.queryAsync(`
      INSERT INTO PollOptions (name, votes, poll_id)
      VALUES(?, 0, (SELECT id FROM Poll WHERE id = ?))
    `, [choice, insertId]);
  }));

  return insertId;
};

module.exports.addChoice = async (username, title, choice) => {
  const { insertId } = await connection.queryAsync(`
    INSERT INTO PollOptions (name, votes, poll_id)
    VALUES(?, 0, (SELECT id FROM Poll WHERE name=? AND 
    user_id=(SELECT id FROM Users WHERE username=?)
    ))
  `,[choice, title, username]);

  return insertId;
};
module.exports.getPolls = async username => {

  const polls = await connection.queryAsync(`
    SELECT * FROM Poll WHERE user_id=
    (SELECT id FROM Users WHERE username = '${username}')
  `);

  return polls;
};

module.exports.getPollsEntry = async (username, title) => {

  const options = await connection.queryAsync(`
    SELECT * FROM PollOptions WHERE poll_id=
    (SELECT id FROM Poll WHERE user_id =
    (SELECT id FROM Users WHERE username = '${username}') AND
    name = '${title}')
  `);

  return options;
};

module.exports.upvote = id => {
  connection.queryAsync(`
    UPDATE PollOptions
    SET votes = votes + 1
    WHERE id='${id}'
  `);
};

module.exports.deletePoll = async id => {
  await connection.queryAsync(`
    DELETE FROM PollOptions WHERE poll_id = ${id}
  `);
  await connection.queryAsync(`
    DELETE FROM Poll WHERE id = ${id}
  `);
};