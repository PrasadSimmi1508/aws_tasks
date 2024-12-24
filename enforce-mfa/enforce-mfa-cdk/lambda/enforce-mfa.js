const AWS = require('aws-sdk');
const iam = new AWS.IAM();

exports.handler = async (event) => {
  try {
    // List all IAM users
    const usersResponse = await iam.listUsers().promise();
    
    // MFA enforcement policy
    const mfaPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Deny',
          Action: '*',
          Resource: 'arn:aws:iam::*:user/*',
          Condition: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        },
      ],
    };

    // Attach the MFA policy to each user
    for (const user of usersResponse.Users) {
      const userName = user.UserName;

      // Attach the MFA enforcement policy
      await iam.putUserPolicy({
        UserName: userName,
        PolicyName: 'EnforceMFA',
        PolicyDocument: JSON.stringify(mfaPolicy),
      }).promise();
    }

    return {
      statusCode: 200,
      body: JSON.stringify('MFA policy applied successfully to all users'),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify('Error applying MFA policy to users'),
    };
  }
};
