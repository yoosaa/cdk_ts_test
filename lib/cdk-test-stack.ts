import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { RemovalPolicy, StackProps } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cf from "aws-cdk-lib/aws-cloudfront";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cf_origins from "aws-cdk-lib/aws-cloudfront-origins";

export class CdkTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * S3 Bucket
     */
    const s3Bucket = new s3.Bucket(this, "TsTestBucket", {
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /**
     * set oai
     */
    const oai = new cf.OriginAccessIdentity(this, "OriginAccessIdentity", {
      comment: "website-distribution-origin-access-identity",
    });

    /**
     * set bucket policy
     */
    const frontWebBucketPolicyStatement = new iam.PolicyStatement({
      actions: ["s3:GetObject"],
      effect: iam.Effect.ALLOW,
      principals: [
        new iam.CanonicalUserPrincipal(
          oai.cloudFrontOriginAccessIdentityS3CanonicalUserId
        ),
      ],
      resources: [`${s3Bucket.bucketArn}/*`],
    });
    s3Bucket.addToResourcePolicy(frontWebBucketPolicyStatement);

    const distribution = new cf.Distribution(this, "TsTestDistribution", {
      comment: "TsTestDistribution",
      defaultRootObject: "index.html",
      priceClass: cf.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cf.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cf.CachePolicy.CACHING_DISABLED,
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        origin: new cf_origins.S3Origin(s3Bucket, {
          originAccessIdentity: oai,
        }),
      },
      minimumProtocolVersion: cf.SecurityPolicyProtocol.TLS_V1_2_2021,
    });
  }
}
