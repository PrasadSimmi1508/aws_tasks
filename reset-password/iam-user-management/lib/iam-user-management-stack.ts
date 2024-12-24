import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class IamUserManagementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Lambda function
    const userManagementLambda = new lambda.Function(this, 'UserManagementFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'user-management.handler',
    });

    // Grant necessary IAM permissions to the Lambda function
    userManagementLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'iam:CreateUser',
          'iam:CreateLoginProfile',
          'iam:UpdateLoginProfile',
        ],
        resources: ['*'], // Adjust resource scope for production
      })
    );
  }
}
