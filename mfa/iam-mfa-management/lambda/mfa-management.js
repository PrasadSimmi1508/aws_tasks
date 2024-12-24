const AWS = require('aws-sdk');
const iam = new AWS.IAM();

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const action = body.action;

    if (action === 'createUser') {
      const { userName, password } = body;

      // Create IAM user
      await iam.createUser({ UserName: userName }).promise();

      // Create login profile (username + password)
      await iam.createLoginProfile({
        UserName: userName,
        Password: password,
        PasswordResetRequired: false,
      }).promise();

      // Attach policy requiring MFA for login
      const mfaPolicy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Deny",
            Action: "*",
            Resource: "*",
            Condition: {
              BoolIfExists: {
                "aws:MultiFactorAuthPresent": "false",
              },
            },
          },
        ],
      };

      await iam.putUserPolicy({
        UserName: userName,
        PolicyName: "EnforceMFA",
        PolicyDocument: JSON.stringify(mfaPolicy),
      }).promise();

      return {
        statusCode: 201,
        body: JSON.stringify({ message: `User ${userName} created and MFA enforced.` }),
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
