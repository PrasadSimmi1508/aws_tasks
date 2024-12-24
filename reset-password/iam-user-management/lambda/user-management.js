const AWS = require('aws-sdk');
const iam = new AWS.IAM();

exports.handler = async (event) => {
  try {
    // Parse the input event
    if (!event.body) throw new Error('Request body is missing.');

    const body = JSON.parse(event.body);
    const action = body.action; // Expected actions: "createUser", "resetPassword"

    if (action === 'createUser') {
      const { userName, password } = body;

      // Create the IAM user
      await iam.createUser({ UserName: userName }).promise();

      // Attach login credentials
      await iam.createLoginProfile({
        UserName: userName,
        Password: password,
        PasswordResetRequired: false,
      }).promise();

      return {
        statusCode: 201,
        body: JSON.stringify({ message: `User ${userName} created successfully.` }),
      };
    } else if (action === 'resetPassword') {
      const { userName, newPassword } = body;

      // Update the password
      await iam.updateLoginProfile({
        UserName: userName,
        Password: newPassword,
        PasswordResetRequired: false,
      }).promise();

      return {
        statusCode: 200,
        body: JSON.stringify({ message: `Password for user ${userName} updated successfully.` }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid action. Use "createUser" or "resetPassword".' }),
    };
  } catch (error) {
    console.error(error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};
