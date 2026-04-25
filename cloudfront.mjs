const PROCESS_ENV = process.env;
const ENV = PROCESS_ENV.NODE_ENV ? PROCESS_ENV.NODE_ENV : 'dev';

const mapProductToEnv = (product) => {
    switch (product) {
        case 'unisplit':
            return 'UNISPLIT';
        case 'universify-portal':
            return 'UNIVERSIFY_PORTAL';
        case 'uni-notifier':
            return 'UNI_NOTIFIER';
        default:
            throw new Error("Invalid product", product);
    }
}

const getCachePolicyId = (product) => {
    const productEnvName = mapProductToEnv(product);
    if (ENV === 'prod') {
        return PROCESS_ENV[`${productEnvName}_CACHE_POLICY_ID_PROD`];
    } else {
        return PROCESS_ENV[`${productEnvName}_CACHE_POLICY_ID_NON_PROD`];
    }
};

const getOriginRequestPolicyId = (product) => {
    const productEnvName = mapProductToEnv(product);
    if (ENV === 'prod') {
        return PROCESS_ENV[`${productEnvName}_ORIGIN_REQUEST_POLICY_ID_PROD`];
    } else {
        return PROCESS_ENV[`${productEnvName}_ORIGIN_REQUEST_POLICY_ID_NON_PROD`];
    }
}

const getOriginId = (product) => {
    const productEnvName = mapProductToEnv(product);
    return PROCESS_ENV[`${productEnvName}_ORIGIN_ID_${ENV.toUpperCase()}`];
}

const getOriginDomainName = (product) => {
    const productEnvName = mapProductToEnv(product);
    return PROCESS_ENV[`${productEnvName}_ORIGIN_DOMAIN_${ENV.toUpperCase()}`];
}

const getOriginAccessIdentity = (product) => {
    const productEnvName = mapProductToEnv(product);
    return PROCESS_ENV[`${productEnvName}_ORIGIN_ACCESS_IDENTITY_${ENV.toUpperCase()}`];
}

const getDefaultRootFile = (product) => {
    const productEnvName = mapProductToEnv(product);
    let defaultRootFile = PROCESS_ENV[`${productEnvName}_DEFAULT_ROOT_FILE_${ENV.toUpperCase()}`];
    return defaultRootFile || 'index.html';
}

const getResponsePagePath = (product) => {
    return "/" + getDefaultRootFile(product);
}

/**
 * 
 * @param {string} customDomain 
 * @param {string} tenantId 
 * @param {string} product 
 * @param {string} certificateArn 
 * @returns 
 */
export const generateDistributionConfigWithTags = (customDomain, tenantId, product, certificateArn) => {
    console.debug(
        `Inside generateDistributionConfigWithTags - ${tenantId} - ${customDomain} - ${product} - ${certificateArn}`
    );

    return {
        DistributionConfigWithTags: {
            DistributionConfig: {
                CallerReference: Date.now().toString(),
                Comment: `For Tenant: ${tenantId}, domain: ${customDomain}`,
                DefaultCacheBehavior: {
                    TargetOriginId: getOriginId(product),
                    TrustedSigners: {
                        Enabled: false,
                        Quantity: 0,
                    },
                    ViewerProtocolPolicy: 'redirect-to-https',
                    AllowedMethods: {
                        Items: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'OPTIONS', 'DELETE'],
                        Quantity: 7,
                        CachedMethods: {
                            Items: ['GET', 'HEAD', 'OPTIONS'],
                            Quantity: 3
                        }
                    },
                    CachePolicyId: getCachePolicyId(product),
                    OriginRequestPolicyId: getOriginRequestPolicyId(product),
                    Compress: true,
                    SmoothStreaming: false
                },
                Enabled: true,
                Origins: {
                    Items: [
                        {
                            DomainName: getOriginDomainName(product),
                            Id: getOriginId(product),
                            ConnectionAttempts: 3,
                            ConnectionTimeout: 10,
                            S3OriginConfig: {
                                OriginAccessIdentity: getOriginAccessIdentity(product),
                            }
                        },
                    ],
                    Quantity: 1,
                },
                Aliases: {
                    Quantity: 1,
                    Items: [customDomain]
                },
                CustomErrorResponses: {
                    Quantity: 2,
                    Items: [
                        {
                            ErrorCode: 403,
                            ErrorCachingMinTTL: 300,
                            ResponseCode: '200',
                            ResponsePagePath: getResponsePagePath(product)
                        },
                        {
                            ErrorCode: 404,
                            ErrorCachingMinTTL: 300,
                            ResponseCode: '200',
                            ResponsePagePath: getResponsePagePath(product)
                        },
                    ]
                },
                DefaultRootObject: getDefaultRootFile(product),
                HttpVersion: 'http2',
                IsIPV6Enabled: true,
                Logging: {
                    Bucket: '',
                    Enabled: false,
                    IncludeCookies: false,
                    Prefix: '',
                },
                PriceClass: 'PriceClass_All',
                ViewerCertificate: {
                    ACMCertificateArn: certificateArn,
                    CloudFrontDefaultCertificate: false,
                    MinimumProtocolVersion: 'TLSv1.2_2019',
                    SSLSupportMethod: 'sni-only',
                },
            },
            Tags: {
                Items: [
                    {
                        Key: 'service',
                        Value: `${mapProductToEnv(product)}-${ENV.toUpperCase()}`
                    },
                    {
                        Key: 'CICD_SERVICE',
                        Value: `${getOriginDomainName(product).replace('.s3.amazonaws.com', '').replace('.s3.us-west-2.amazonaws.com', '').replace('.s3.us-east-1.amazonaws.com', '')}`
                    }
                ]
            }
        }
    };
}
