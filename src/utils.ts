import ImageKit from "imagekit";

// Helper for checking if we're running on server
export const isServer = typeof window === 'undefined';

// Validate ImageKit environment variables
const validateImageKitEnv = () => {
  // Log environment variables for debugging (values will be hidden in production)
  console.log('Environment check - NEXT_PUBLIC_PUBLIC_KEY exists:', !!process.env.NEXT_PUBLIC_PUBLIC_KEY);
  console.log('Environment check - NEXT_PUBLIC_URL_ENDPOINT exists:', !!process.env.NEXT_PUBLIC_URL_ENDPOINT);
  console.log('Environment check - PRIVATE_KEY exists:', !!process.env.PRIVATE_KEY);
  console.log('Running on server:', isServer);
  
  const requiredVars = {
    publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY || '',
    privateKey: process.env.PRIVATE_KEY || '',
    urlEndpoint: process.env.NEXT_PUBLIC_URL_ENDPOINT || ''
  };

  // Create a more specific error message
  const missingVars = [];
  if (!requiredVars.publicKey) missingVars.push('NEXT_PUBLIC_PUBLIC_KEY');
  if (isServer && !requiredVars.privateKey) missingVars.push('PRIVATE_KEY'); // Only require privateKey on server
  if (!requiredVars.urlEndpoint) missingVars.push('NEXT_PUBLIC_URL_ENDPOINT');

  if (missingVars.length > 0) {
    throw new Error(`Missing ImageKit environment variables: ${missingVars.join(', ')}. Please check your .env and .env.local files.`);
  }

  return requiredVars;
};

// Create a client-safe version of ImageKit
// We need a different initialization approach for client vs server
let imagekitInstance: ImageKit;

try {
  // On the server, we can use the full initialization with privateKey
  if (isServer) {
    const { publicKey, privateKey, urlEndpoint } = validateImageKitEnv();
    imagekitInstance = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
  } else {
    // On the client, we only use the public parts
    // Note: Client-side only operations like URL generation will work,
    // but upload/management operations that need privateKey won't work
    const { publicKey, urlEndpoint } = validateImageKitEnv();
    imagekitInstance = new ImageKit({
      publicKey,
      privateKey: "dummy-private-key-for-client", // This is a workaround for TypeScript
      urlEndpoint,
    });
  }
} catch (error) {
  console.error('Error initializing ImageKit:', error);
  // Create a fallback instance with dummy values for client-side
  // This prevents the app from crashing completely
  if (!isServer) {
    imagekitInstance = new ImageKit({
      publicKey: "dummy-public-key",
      privateKey: "dummy-private-key",
      urlEndpoint: "https://ik.imagekit.io/dummy",
    });
  } else {
    // Re-throw on server since we can't proceed without proper config
    throw error;
  }
}

export const imagekit = imagekitInstance;

// Safely get image URL from ImageKit
export const getImageUrl = (path: string) => {
  if (!path) return "";
  return `${process.env.NEXT_PUBLIC_URL_ENDPOINT}/${path}`;
};