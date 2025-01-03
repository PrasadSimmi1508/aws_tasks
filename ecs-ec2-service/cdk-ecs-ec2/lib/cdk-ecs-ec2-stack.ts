import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';

export class CdkEcsEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Fetch the current AWS account ID and region dynamically
    const accountId = cdk.Aws.ACCOUNT_ID;
    const region = cdk.Aws.REGION;

    // Default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'CustomVpc', {
      isDefault: true,
    });

    // Create a Security Group for the ECS instances
    const securityGroup = new ec2.SecurityGroup(this, 'CustomEcsSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: 'MyCustomEcsSecurityGroup',
    });

    // Fetch the ECR repository dynamically by name
    const ecrRepository = ecr.Repository.fromRepositoryName(this, 'CustomEcrRepo', 'myecr-repo'); // Replace with your ECR repo name

    // Define the ECS Cluster
    const cluster = new ecs.Cluster(this, 'CustomCluster', {
      vpc,
      clusterName: 'MyCustomEcsCluster',
    });

    // Add EC2 capacity to the ECS cluster (EC2 instances for the cluster)
    cluster.addCapacity('CustomEc2Capacity', {
      instanceType: new ec2.InstanceType('t3.micro'), // Modify as per your requirements
      minCapacity: 1, // Minimum number of EC2 instances
      machineImageType: ecs.MachineImageType.AMAZON_LINUX_2,
    });

    // Task Definition
    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'CustomTaskDefinition', {
      networkMode: ecs.NetworkMode.BRIDGE,
      family: 'MyCustomTaskFamily',
    });

    // Add a container to the task definition
    const backendContainer = taskDefinition.addContainer('CustomBackendContainer', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepository),
      memoryLimitMiB: 512, // Modify based on your requirements
      cpu: 256, // Modify based on your requirements
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'CustomBackendLogs',
      }),
    });

    // Expose port 80 (or any other port your backend uses)
    backendContainer.addPortMappings({
      containerPort: 80, // This should match the port your backend service is listening on
      hostPort: 80, // You can specify a host port if needed
    });

    // Define the EC2 Service with dynamic subnet, security group, and task definition
    const ecsService = new ecsPatterns.ApplicationLoadBalancedEc2Service(this, 'CustomBackendService', {
      cluster,
      taskDefinition,
      publicLoadBalancer: true, // Optional: Expose through a public load balancer
      loadBalancerName: 'MyCustomLoadBalancer',
    });

    // Associate security group to the service and load balancer
    ecsService.service.connections.addSecurityGroup(securityGroup);
    ecsService.loadBalancer.connections.addSecurityGroup(securityGroup);

    // Optional: IAM Role to allow ECS to pull images from ECR
    const ecsTaskRole = new iam.Role(this, 'CustomEcsTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      roleName: 'MyCustomEcsTaskRole',
    });
    ecrRepository.grantPull(ecsTaskRole);
  }
}
