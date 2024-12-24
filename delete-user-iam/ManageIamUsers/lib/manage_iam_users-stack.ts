import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export class ManageIamUsersStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda Function to manage IAM Users
    const manageIamUsersLambda = new lambda.Function(this, 'ManageIamUsersLambda', {
      runtime: lambda.Runtime.NODEJS_16_X, // Supported runtime
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10), // Increase the timeout to 10 seconds
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const iam = new AWS.IAM();

        exports.handler = async (event) => {
          const { action, username, password } = event;

          try {
            if (action === 'create') {
              // Create the IAM User
              await iam.createUser({ UserName: username }).promise();

              // Set Login Profile with Password
              await iam.createLoginProfile({
                UserName: username,
                Password: password,
                PasswordResetRequired: true // Enforce password reset on first login
              }).promise();

              // Attach Change Password Policy
              await iam.attachUserPolicy({
                UserName: username,
                PolicyArn: 'arn:aws:iam::aws:policy/IAMUserChangePassword',
              }).promise();

              return { statusCode: 200, body: JSON.stringify({ message: 'User created successfully.' }) };
            } else if (action === 'delete') {
              // Detach Policies
              const policies = await iam.listAttachedUserPolicies({ UserName: username }).promise();
              for (const policy of policies.AttachedPolicies) {
                await iam.detachUserPolicy({
                  UserName: username,
                  PolicyArn: policy.PolicyArn,
                }).promise();
              }

              // Delete Login Profile
              try {
                await iam.deleteLoginProfile({ UserName: username }).promise();
              } catch (e) {
                // Ignore if no login profile exists
              }

              // Delete the IAM User
              await iam.deleteUser({ UserName: username }).promise();

              return { statusCode: 200, body: JSON.stringify({ message: 'User deleted successfully.' }) };
            } else {
              return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
            }
          } catch (error) {
            return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
          }
        };
      `),
    });

    // Grant Lambda permissions to manage IAM users
    manageIamUsersLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['iam:CreateUser', 'iam:DeleteUser', 'iam:CreateLoginProfile', 'iam:DeleteLoginProfile', 'iam:AttachUserPolicy', 'iam:DetachUserPolicy', 'iam:ListAttachedUserPolicies'],
        resources: ['*'],
      })
    );
  }
}
