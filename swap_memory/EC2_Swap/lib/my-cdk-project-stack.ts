import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as fs from 'fs';
import { Construct } from 'constructs';

export class MyCdkProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      // Specify the account and region in which to deploy the stack
      env: {
        region: 'ap-south-1',  // Example: Mumbai region
        account: '',  // Replace with your AWS Account ID
      },
      ...props,
    });

    // VPC (default VPC will be used if not specified)
    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', {
      isDefault: true,
    });

    // Create an EC2 key pair (replace with your key name)
    const keyName = '';  // Replace with your actual EC2 key name

    // Security group allowing SSH (port 22) access
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access');

    // Specify the Ubuntu 24.04 LTS AMI ID for ap-south-1
    const ubuntuAmiId = 'ami-09b0a86a2c84101e1'; // Replace with the actual AMI ID

    // EC2 Instance Role
    const role = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    // Instance creation with the specified parameters
    const instance = new ec2.Instance(this, 'UbuntuInstance', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.genericLinux({
        'ap-south-1': ubuntuAmiId,
      }),
      vpc,
      securityGroup,
      keyName,
      role,
    });

    // Read your shell script and add as User Data
    const userDataScript = fs.readFileSync('D:/swap_memory_setup.sh', 'utf8');
    instance.addUserData(userDataScript);
  }
}
