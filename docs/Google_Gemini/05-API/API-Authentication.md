// Pseudo-code / Enterprise Node.js Middleware Concept for RBAC
function authorize(requiredPermission) {
    return async (req, res, next) => {
        try {
            const userTokenPayload = req.user; // Decrypted from JWT via Tenant Context Middleware
            const tenantId = userTokenPayload.tenant_id;
            const userId = userTokenPayload.userId;

            // Fetch user roles and permissions from database (or Redis cache for optimization)
            const userPermissions = await getUserPermissionsFromCacheOrDB(userId, tenantId);

            if (!userPermissions.includes(requiredPermission)) {
                return res.status(403).json({
                    error: "Access Denied",
                    message: `You do not have the required permission: ${requiredPermission}`
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({ error: "Internal Authorization Error" });
        }
    };
}