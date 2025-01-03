import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class CdkSpotInstanceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });

    // Define the role for Spot Fleet
    const spotFleetRole = new iam.Role(this, 'SpotFleetRole', {
      assumedBy: new iam.ServicePrincipal('spotfleet.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2SpotFleetTaggingRole'),
      ],
    });

    // Define the AMI (Amazon Linux 2023 AMI)
    const ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
    });

    // Define a Security Group
    const vpc = ec2.Vpc.fromLookup(this, 'VPC', { isDefault: true });
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
    });

    // Spot Fleet Configuration
    new ec2.CfnSpotFleet(this, 'SpotInstanceFleet', {
      spotFleetRequestConfigData: {
        iamFleetRole: spotFleetRole.roleArn,
        targetCapacity: 1,
        launchSpecifications: [
          {
            instanceType: 'm5.large',
            imageId: ami.getImage(this).imageId,
            securityGroups: [
              {
                groupId: securityGroup.securityGroupId,
              },
            ],
            keyName: 'ansible-kp',
            subnetId: vpc.publicSubnets[0].subnetId, // Use the first public subnet
          },
        ],
        type: 'request', // Correct value for Spot Fleet Type
        terminateInstancesWithExpiration: true,
      },
    });
  }
}

const app = new cdk.App();
new CdkSpotInstanceStack(app, 'CdkSpotInstanceStack');
