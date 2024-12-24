import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export class EcsDashboardStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'MyCluster', {
      clusterName: 'MyEcsCluster',
    });

    // ECS Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'MyTaskDef');
    taskDefinition.addContainer('MyContainer', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'), // Use a sample container image
    });

    // ECS Service
    const service = new ecs.FargateService(this, 'MyFargateService', {
      cluster,
      taskDefinition,
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'EcsDashboard', {
      dashboardName: 'EcsDashboard',
      start: '-PT1H', // Show data from the last hour
    });

    // ECS CPU Usage Metric
    const cpuMetric = service.metricCpuUtilization();

    // ECS Memory Usage Metric
    const memoryMetric = service.metricMemoryUtilization();

    // ECS Network In and Out Metrics
    const networkInMetric = service.metric('NetworkIn');
    const networkOutMetric = service.metric('NetworkOut');

    // ECS CPU Widget
    const cpuWidget = new cloudwatch.GraphWidget({
      title: 'ECS CPU Usage',
      width: 8,
      height: 6,
      left: [cpuMetric],  // Use 'left' to define metrics for the left axis
    });

    // ECS Memory Widget
    const memoryWidget = new cloudwatch.GraphWidget({
      title: 'ECS Memory Usage',
      width: 8,
      height: 6,
      left: [memoryMetric],  // Use 'left' to define metrics for the left axis
    });

    // ECS Network Widget
    const networkWidget = new cloudwatch.GraphWidget({
      title: 'ECS Network Usage',
      width: 8,
      height: 6,
      left: [networkInMetric, networkOutMetric],  // Use 'left' to define metrics for the left axis
    });

    // Add Widgets to Dashboard
    dashboard.addWidgets(cpuWidget, memoryWidget, networkWidget);

    // Lambda Function
    const helloWorldLambda = new lambda.Function(this, 'HelloWorldFunction', {
      runtime: lambda.Runtime.NODEJS_16_X, // Updated to NODEJS_16_X
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async () => {
          return {
            statusCode: 200,
            body: "Hello, World",
          };
        };
      `),
    });

    // Lambda Widget
    const lambdaWidget = new cloudwatch.TextWidget({
      markdown: `[Click here to invoke Hello World Lambda](https://console.aws.amazon.com/lambda/home?region=${cdk.Stack.of(this).region}#/functions/${helloWorldLambda.functionName})`,
      width: 24,
      height: 6,
    });

    // Add Lambda Widget to Dashboard
    dashboard.addWidgets(lambdaWidget);
  }
}
