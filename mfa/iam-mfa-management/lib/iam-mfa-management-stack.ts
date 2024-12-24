import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class IamMfaManagementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function to manage users and enforce MFA
    const mfaManagementLambda = new lambda.Function(this, 'MfaManagementLambda', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'mfa-management.handler',
      timeout: cdk.Duration.seconds(10),
    });

    // Grant IAM permissions to the Lambda function
    mfaManagementLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'iam:CreateUser',
          'iam:CreateLoginProfile',
          'iam:UpdateLoginProfile',
          'iam:PutUserPolicy',
        ],
        resources: ['*'], // Adjust in production for tighter security
      })
    );
  }
}
