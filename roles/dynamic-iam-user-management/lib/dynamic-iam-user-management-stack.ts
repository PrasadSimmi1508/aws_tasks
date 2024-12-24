import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export class DynamicIamUserManagementStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define IAM Groups
    const developerGroup = new iam.Group(this, 'DeveloperGroup');
    const adminGroup = new iam.Group(this, 'AdminGroup');
    const devOpsGroup = new iam.Group(this, 'DevOpsGroup');
    const testerGroup = new iam.Group(this, 'TesterGroup');

    // Attach policies to groups
    developerGroup.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
    adminGroup.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));
    devOpsGroup.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess'));
    testerGroup.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess'));

    // Create Lambda function for dynamic user creation
    const userCreationLambda = new lambda.Function(this, 'UserCreationLambda', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10), // Set timeout to 10 seconds
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      environment: {
        DEVELOPER_GROUP: developerGroup.groupName,
        ADMIN_GROUP: adminGroup.groupName,
        DEVOPS_GROUP: devOpsGroup.groupName,
        TESTER_GROUP: testerGroup.groupName,
      },
    });

    // Attach the custom IAM policy to Lambda execution role
    userCreationLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'iam:CreateUser',
          'iam:CreateLoginProfile',
          'iam:AddUserToGroup',
          'iam:RemoveUserFromGroup',
          'iam:DeleteUser',
          'iam:DeleteLoginProfile',
          'iam:ListGroupsForUser',
          'iam:ListAccessKeys',
          'iam:DeleteAccessKey'
        ],
        resources: ['*'],
      })
    );
  }
}
