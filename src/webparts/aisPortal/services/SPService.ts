import { WebPartContext } from "@microsoft/sp-webpart-base";
import { spfi, SPFx, SPFI } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-users/web";
import "@pnp/sp/batching";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/fields";
import { Asset, User, Request, Vendor, Site, Department, AssetFamily, AssetType, AssetStatus, RequestStatus, HardwareProduct, SoftwareProfile, HardwareCondition } from "../types";

let sp: SPFI;
let _context: WebPartContext;

export const initSPService = (context: WebPartContext): void => {
    _context = context;
    sp = spfi().using(SPFx(context));
};

export const getTargetWeb = (url: string) => {
    return Web(url).using(SPFx(_context));
};

// Helper to safely get string
const getSafeString = (value: unknown): string => {
    return value ? String(value) : "";
};

// Helper to safely get number
const getSafeNumber = (value: unknown): number => {
    return value ? Number(value) : 0;
};

// Helper to safely get date string
const getSafeDate = (value: string | undefined): string => {
    return value ? value : new Date().toISOString();
};

const formatDateForSP = (dateStr: string | undefined): string | null => {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d.toISOString();
    } catch {
        return null;
    }
};

const safeJsonParse = <T>(value: string | any, fallback: T): T => {
    if (value && typeof value === 'object') return value as T;
    if (typeof value !== 'string') return fallback;

    try {
        return JSON.parse(value);
    } catch {
        try {
            // Try decoding HTML entities (SharePoint often returns JSON in rich text fields as encoded HTML)
            const decoded = new DOMParser()
                .parseFromString(value, "text/html")
                .documentElement.textContent;
            if (decoded) return JSON.parse(decoded);
        } catch (e) {
            // console.warn("Failed to decode/parse JSON", e);
        }
        return fallback;
    }
};

// ... existing code ...



// Helper to create a complete User object from partial data or defaults
const mapToUser = (spUser: any): User => {
    if (!spUser) {
        return {
            id: "0", fullName: "Unknown", firstName: "", lastName: "", email: "", avatarUrl: "", role: "user", isVerified: false, jobTitle: "", department: "", organization: "", dateOfJoining: "", dateOfExit: undefined, businessPhone: "", mobileNo: "", address: "", city: "", postalCode: "", linkedin: "", twitter: "", userType: "", extension: "", permissionGroups: [], principalName: "", userStatus: "", userTypeDetail: "", createdDate: new Date().toISOString(), modifiedDate: new Date().toISOString(), createdBy: "", modifiedBy: "", site: [], typeOfContact: [], platformAccounts: [], history: []
        };
    }
    const email = getSafeString(spUser.Email || spUser.EMail);
    const fullName = getSafeString(spUser.FullName) || getSafeString(spUser.FirstName);
    const id = String(spUser.Id || spUser.ID || "0");

    // Avatar logic: Prioritize Item_x0020_Cover, then Attachments, then AvatarUrl, then placeholder
    let avatarUrl = `https://i.pravatar.cc/150?u=${id}`;
    if (spUser.Item_x0020_Cover && spUser.Item_x0020_Cover.Url) {
        avatarUrl = spUser.Item_x0020_Cover.Url;
    } else if (spUser.AttachmentFiles && spUser.AttachmentFiles.length > 0) {
        avatarUrl = `https://smalsusinfolabs.sharepoint.com${spUser.AttachmentFiles[0].ServerRelativeUrl}`;
    } else if (spUser.AvatarUrl) {
        avatarUrl = getSafeString(spUser.AvatarUrl);
    }

    return {
        id: id,
        fullName: fullName,
        firstName: getSafeString(spUser.FirstName) || fullName.split(' ')[0] || '',
        lastName: getSafeString(spUser.LastName) || fullName.split(' ').slice(1).join(' ') || '',
        email: email,
        avatarUrl: avatarUrl,
        role: (getSafeString(spUser.Role).toLowerCase() === 'admin') ? 'admin' : 'user',
        isVerified: true,
        jobTitle: getSafeString(spUser.JobTitle) || "Employee",
        department: getSafeString(spUser.Department) || "General",
        organization: getSafeString(spUser.Company) || "Smalsus Infolabs Pvt Ltd",
        dateOfJoining: getSafeString(spUser.Date_x0020_Of_x0020_Joining as string) || "2023-01-01",
        dateOfExit: spUser.DateOfExit || undefined,
        businessPhone: getSafeString(spUser.WorkPhone),
        mobileNo: getSafeString(spUser.CellPhone),
        address: getSafeString(spUser.WorkAddress),
        city: getSafeString(spUser.WorkCity),
        postalCode: getSafeString(spUser.WorkZip),
        linkedin: spUser.LinkedIn?.Url || "",
        twitter: spUser.Twitter?.Url || "",
        userType: spUser.User_x0020_Type === 'Internal' ? 'Internal User' : (spUser.User_x0020_Type || 'Internal User'),
        extension: "",
        permissionGroups: [],
        principalName: email,
        userStatus: "Active",
        userTypeDetail: "Member",
        createdDate: getSafeDate(spUser.Created),
        modifiedDate: getSafeDate(spUser.Modified),
        createdBy: "System",
        modifiedBy: "System",
        site: spUser.Site ? (Array.isArray(spUser.Site) ? spUser.Site : [spUser.Site]) : [],
        typeOfContact: ["Employee"],
        platformAccounts: [],
        history: safeJsonParse(spUser.History, []),
        notes: getSafeString(spUser.Comments)
    };
};

export const getVendors = async (): Promise<Vendor[]> => {
    if (!sp) return [];
    try {
        const items = await sp.web.lists.getByTitle("Vendors").items.top(5000)();
        return items.map(item => ({
            id: String(item.ID),
            name: getSafeString(item.Title),
            contactName: getSafeString(item.ContactName),
            email: getSafeString(item.Email),
            website: item.Website?.Url || (typeof item.Website === 'string' ? item.Website : ""),
            notes: ""
        }));
    } catch (e) {
        console.error("Error fetching vendors", e);
        return [];
    }
};

export const addVendor = async (vendor: Vendor): Promise<Vendor> => {
    if (!sp) throw new Error("SPService not initialized");
    try {
        const payload: any = {
            Title: vendor.name,
            ContactName: vendor.contactName,
            Email: vendor.email,
            Website: { Url: vendor.website, Description: vendor.website }
        };
        const result = await sp.web.lists.getByTitle("Vendors").items.add(payload);
        const item = result.data || result;
        return {
            ...vendor,
            id: String(item.ID)
        };
    } catch (e) {
        console.error("Error adding vendor", e);
        throw e;
    }
};

export const deleteVendor = async (vendorId: string): Promise<void> => {
    if (!sp) throw new Error("SPService not initialized");
    try {
        await sp.web.lists.getByTitle("Vendors").items.getById(parseInt(vendorId)).delete();
    } catch (e) {
        console.error("Error deleting vendor", e);
        throw e;
    }
};


export const getSites = async (): Promise<Site[]> => {
    if (!sp) return [];
    try {
        // Fetch from SmartMetadata where TaxType is 'Sites'
        const items = await sp.web.lists.getByTitle("SmartMetadata").items
            .filter("TaxType eq 'Sites'")
            .select("Id", "Title")();
        console.log(items);
        return items.map((item: any) => ({
            id: String(item.ID),
            name: item.Title
        }

        ));
    } catch (e) {
        console.error("Error fetching sites from SmartMetadata", e);
        return [];
    }
};

export const addSite = async (name: string): Promise<Site> => {
    if (!sp) throw new Error("SPService not initialized");
    try {
        const payload = {
            Title: name,
            TaxType: 'Sites'
        };
        const result = await sp.web.lists.getByTitle("SmartMetadata").items.add(payload);
        const item = result.data || result;
        return {
            id: String(item.ID),
            name: item.Title
        };
    } catch (e) {
        console.error("Error adding site to SmartMetadata", e);
        throw e;
    }
};

export const deleteSite = async (siteId: string): Promise<void> => {
    if (!sp) throw new Error("SPService not initialized");
    try {
        await sp.web.lists.getByTitle("SmartMetadata").items.getById(parseInt(siteId)).delete();
    } catch (e) {
        console.error("Error deleting site from SmartMetadata", e);
        throw e;
    }
};

export const getDepartments = async (): Promise<Department[]> => {
    if (!sp) return [];
    try {
        const field = await sp.web.lists.getByTitle("Contacts").fields.getByInternalNameOrTitle("Department")();
        console.log(field);
        return (field.Choices || []).map((c: string) => ({
            id: c,
            name: c
        }));
    } catch (e) {
        console.error("Error fetching departments from Contacts list", e);
        return [];
    }
};

export const addDepartment = async (name: string): Promise<Department> => {
    if (!sp) throw new Error("SPService not initialized");
    try {
        const field = await sp.web.lists.getByTitle("Contacts").fields.getByInternalNameOrTitle("Department")();
        const choices = field.Choices || [];
        if (choices.includes(name)) {
            throw new Error("Department already exists");
        }
        const newChoices = [...choices, name];
        await sp.web.lists.getByTitle("Contacts").fields.getByInternalNameOrTitle("Department").update({ Choices: newChoices });
        return {
            id: name,
            name: name
        };
    } catch (e) {
        console.error("Error adding department to Contacts list", e);
        throw e;
    }
};

export const deleteDepartment = async (departmentId: string): Promise<void> => {
    if (!sp) throw new Error("SPService not initialized");
    try {
        const field = await sp.web.lists.getByTitle("Contacts").fields.getByInternalNameOrTitle("Department")();
        const choices = field.Choices || [];
        const newChoices = choices.filter((c: string) => c !== departmentId);
        await sp.web.lists.getByTitle("Contacts").fields.getByInternalNameOrTitle("Department").update({ Choices: newChoices });
    } catch (e) {
        console.error("Error deleting department from Contacts list", e);
        throw e;
    }
};

export const getAssetFamilies = async (): Promise<AssetFamily[]> => {
    if (!sp) return [];
    try {
        const items = await sp.web.lists.getByTitle("AssetRepository").items.select("*", "VendorName/Title").expand("VendorName").top(5000)();
        console.log("Items", items);
        return items.map(item => {
            const isHardware = item.AssetType === "Hardware";
            // Lookup columns return an object (or null) when expanded
            const vendorName = item.VendorName?.Title || "";

            const base = {
                id: String(item.ID),
                assetType: isHardware ? AssetType.HARDWARE : AssetType.LICENSE,
                name: getSafeString(item.Title),
                productCode: getSafeString(item.ProductCode),
                category: getSafeString(item.Category) || (isHardware ? 'Accessory' : 'External'),
                createdDate: getSafeDate(item.Created),
                lastModifiedDate: getSafeDate(item.Modified),
                description: getSafeString(item.Description),
                assignmentModel: (getSafeString(item.AssignmentModel) as 'Single' | 'Multiple') || 'Single',
                totalCount: item.TotalCount || 0
            };

            if (isHardware) {
                return {
                    ...base,
                    manufacturer: vendorName, // Mapped from Lookup
                    modelNumber: getSafeString(item.ModelNumber),
                    standardConfiguration: getSafeString(item.Configuration),
                } as HardwareProduct;
            } else {
                return {
                    ...base,
                    vendor: vendorName, // Mapped from Lookup
                    variants: [{ id: `var-${item.ID}`, name: 'Standard', licenseType: 'Subscription', cost: 0 }]
                } as SoftwareProfile;
            }
        });
    } catch (e) {
        console.error("Error fetching families", e);
        return [];
    }
};

export const bulkAddAssets = async (assets: Asset[], familyId: string): Promise<void> => {
    if (!sp) throw new Error("SPService not initialized");
    try {
        const [batchedWeb, execute] = sp.web.batched();
        const list = batchedWeb.lists.getByTitle("AssetManagementSystem");

        // Parse family ID (assuming 'repo-123' format or similar)
        const repoId = parseInt(familyId.replace('repo-', ''));

        if (isNaN(repoId)) throw new Error("Invalid Family ID for bulk creation");

        assets.forEach(asset => {
            const payload: any = {
                Title: asset.assetId,
                AssetType: asset.assetType === AssetType.HARDWARE ? 'Hardware' : 'License',
                // License fields
                LicenseType: asset.variantType,
                LicenseKey: asset.licenseKey,
                expiryDate: asset.expiryDate,
                // Hardware fields
                serialNumber: asset.serialNumber,
                modelNumber: asset.modelNumber,
                macAddress: asset.macAddress,
                Location: asset.location,
                Condition: asset.condition,
                WarrantyExpiryDate: asset.warrantyExpiryDate,
                ComplianceStatus: asset.complianceStatus,
                // Common
                Cost: asset.cost,
                purchaseDate: asset.purchaseDate,
                Status: asset.status,
                assetRepoId: repoId,
            };

            if (asset.assignedUser) {
                payload.assignToUserId = parseInt(String(asset.assignedUser.id));
            }

            list.items.add(payload);
        });

        await execute();

        // Update functionality: update family count in AssetRepository
        // First get the family to know current count
        const familyItem = await sp.web.lists.getByTitle("AssetRepository").items.getById(repoId)();
        const currentCount = familyItem.TotalCount || 0;
        const newCount = currentCount + assets.length;

        await sp.web.lists.getByTitle("AssetRepository").items.getById(repoId).update({
            TotalCount: newCount
        });

    } catch (e) {
        console.error("Error bulk adding assets", e);
        throw e;
    }
};

export const addAssetFamily = async (family: AssetFamily): Promise<AssetFamily> => {
    if (!sp) throw new Error("SPService not initialized");
    try {

        // Fetch vendors to resolve the Lookup ID (required to prevent "Primitive Value" OData error)
        const allVendors = await getVendors();
        const isHardware = family.assetType === AssetType.HARDWARE;
        const vendorNameToCheck = isHardware ? (family as any).manufacturer : (family as any).vendor;
        const vendorObj = allVendors.find(v => v.name === vendorNameToCheck);

        const payload: any = {
            Title: family.name,
            AssetType: isHardware ? 'Hardware' : 'License',
            ProductCode: family.productCode,
            Category: family.category,
            Description: family.description || '',
            AssignmentModel: family.assignmentModel || 'Single'
        };

        if (vendorObj) {
            payload.VendorNameId = parseInt(vendorObj.id);
        } else {
            console.warn(`Vendor '${vendorNameToCheck}' not found in Vendors list. Logic assumes Lookup column.`);
        }

        if (isHardware) {
            // const hw = family as HardwareProduct;
            // payload.ModelNumber = hw.modelNumber || ''; // Error: Column does not exist
            // payload.Configuration = hw.standardConfiguration || ''; // Commenting out to be safe
        } else {
            // Software specific fields if any
        }

        const result = await sp.web.lists.getByTitle("AssetRepository").items.add(payload);
        console.log("Add Result:", result);

        // Fallback: result.data (standard) or result (if direct object returned)
        const item = result.data || result;

        if (!item) {
            throw new Error(`Item added but no data returned. Result: ${JSON.stringify(result)}`);
        }

        const id = item.ID || item.Id || item.id;
        if (!id) {
            throw new Error(`Item created but ID is missing. Result: ${JSON.stringify(result)}`);
        }

        // Return the created object mapped back to our internal type
        // Use the ID generated by SharePoint and combine with payload
        const base = {
            id: String(id),
            assetType: isHardware ? AssetType.HARDWARE : AssetType.LICENSE,
            name: payload.Title,
            productCode: payload.ProductCode,
            category: payload.Category,
            createdDate: getSafeDate(item.Created),
            lastModifiedDate: getSafeDate(item.Modified),
            description: payload.Description,
            assignmentModel: payload.AssignmentModel
        };

        if (isHardware) {
            return {
                ...base,
                manufacturer: vendorNameToCheck, // Use the variable we resolved earlier
                modelNumber: payload.ModelNumber,
                standardConfiguration: payload.Configuration,
            } as HardwareProduct;
        } else {
            return {
                ...base,
                vendor: vendorNameToCheck, // Use the variable we resolved earlier
                variants: [{ id: `var-${item.ID}`, name: 'Standard', licenseType: 'Subscription', cost: 0 }]
            } as SoftwareProfile;
        }

    } catch (e) {
        console.error("Error adding asset family", e);
        throw e;
    }
};


export const updateAssetFamily = async (family: AssetFamily): Promise<AssetFamily> => {
    if (!sp) throw new Error("SPService not initialized");
    try {
        const id = parseInt(family.id);
        if (isNaN(id)) throw new Error("Invalid Asset Family ID");

        // Fetch vendors to resolve the Lookup ID
        const allVendors = await getVendors();
        const isHardware = family.assetType === AssetType.HARDWARE;
        const vendorNameToCheck = isHardware ? (family as any).manufacturer : (family as any).vendor;
        const vendorObj = allVendors.find(v => v.name === vendorNameToCheck);

        const payload: any = {
            Title: family.name,
            AssetType: isHardware ? 'Hardware' : 'License',
            ProductCode: family.productCode,
            Category: family.category,
            Description: family.description || '',
            AssignmentModel: family.assignmentModel || 'Single'
        };

        if (vendorObj) {
            payload.VendorNameId = parseInt(vendorObj.id);
        }

        if (isHardware) {
            // const hw = family as HardwareProduct;
            // payload.ModelNumber = hw.modelNumber || '';
            // payload.Configuration = hw.standardConfiguration || '';
        }

        await sp.web.lists.getByTitle("AssetRepository").items.getById(id).update(payload);

        return {
            ...family,
            lastModifiedDate: new Date().toISOString()
        };
    } catch (e) {
        console.error("Error updating asset family", e);
        throw e;
    }
};


export const addAsset = async (asset: Asset): Promise<Asset> => {
    if (!sp) throw new Error("SPService not initialized");
    try {
        const assetRepoId = asset.familyId ? parseInt(asset.familyId.replace('repo-', '')) : (asset.assetRepo?.Id ? parseInt(asset.assetRepo.Id as string) : null);
        const assignToUserIds = asset.assignedUsers && asset.assignedUsers.length > 0
            ? asset.assignedUsers.map(u => parseInt((u.spId || u.id) as string)).filter(n => !isNaN(n))
            : (asset.assignedUser ? [parseInt((asset.assignedUser.spId || asset.assignedUser.id) as string)] : []);

        const payload: any = {
            Title: asset.title || "",
            AssetId: asset.assetId || "",
            Status: asset.status || "",
            purchaseDate: formatDateForSP(asset.purchaseDate),
            Cost: asset.cost ?? 0,
            AssetType: asset.assetType || "",
            Topic: asset.topic ? (Array.isArray(asset.topic) ? asset.topic : [asset.topic]) : [],
            Country: asset.country || "",
            EndDate: formatDateForSP(asset.endDate),
            StartDate: formatDateForSP(asset.startDate),
            GeographicalArea: asset.geographicalArea || "",
            ProjectType: asset.projectType || "",
            TotalLicenses: asset.totalLicenses ?? 0,
            UsedLicenses: asset.usedLicenses ?? 0,
            configuration: asset.configuration || "",
            manufacturerVendor: asset.manufacturerVendor || "",
            assetValue: asset.assetValue ?? 0,
            modelNumber: asset.modelNumber || "",
            serialNumber: asset.serialNumber || "",
            macAddress: asset.macAddress || "",
            configurationDetails: asset.configurationDetails || "",
            ipAddress: asset.ipAddress || "",
            softwareName: asset.softwareName || "",
            licenseKey: asset.licenseKey || "",
            numberOfLicenses: asset.numberOfLicenses ?? 0,
            licenseOwner: asset.licenseOwner || "",
            complianceStatus: asset.complianceStatus || null,
            expiryDate: formatDateForSP(asset.expiryDate),
            Email: asset.email || "",
            emailType: asset.emailType || null,
            RequestHistory: asset.requestHistory || "",
            PrivacySettings: asset.privacySettings || "",
            Condition: asset.condition || "",
            assetRepoId: assetRepoId,
            assignToUserId: assignToUserIds,
            LicenseType: asset.variantType || asset.licenseType || ""
        };

        const result = await sp.web.lists.getByTitle("AssetManagementSystem").items.add(payload);
        const item = result.data || result;

        return {
            ...asset,
            id: String(item.ID),
            created: getSafeDate(item.Created),
            modified: getSafeDate(item.Modified)
        };
    } catch (e) {
        console.error("Error in addAsset:", e);
        throw e;
    }
};

export const updateAsset = async (asset: Asset): Promise<Asset> => {
    if (!sp) throw new Error("SPService not initialized");
    const id = parseInt(asset.id);
    if (isNaN(id)) throw new Error("Invalid Asset ID for update");

    try {
        const assetRepoId = asset.familyId ? parseInt(asset.familyId.replace('repo-', '')) : (asset.assetRepo?.Id ? parseInt(asset.assetRepo.Id as string) : null);
        const assignToUserIds = asset.assignedUsers && asset.assignedUsers.length > 0
            ? asset.assignedUsers.map(u => parseInt((u.spId || u.id) as string)).filter(n => !isNaN(n))
            : (asset.assignedUser ? [parseInt((asset.assignedUser.spId || asset.assignedUser.id) as string)] : []);

        const updateData: any = {
            Title: asset.title || "",
            AssetId: asset.assetId || "",
            Status: asset.status || "",
            purchaseDate: formatDateForSP(asset.purchaseDate),
            Cost: asset.cost ?? 0,
            AssetType: asset.assetType || "",
            Topic: asset.topic ? (Array.isArray(asset.topic) ? asset.topic : [asset.topic]) : [],
            Country: asset.country || "",
            EndDate: formatDateForSP(asset.renewalDate || asset.endDate),
            StartDate: formatDateForSP(asset.startDate || asset.purchaseDate),
            GeographicalArea: asset.geographicalArea || "",
            ProjectType: asset.projectType || "",
            TotalLicenses: asset.totalLicenses ?? 0,
            UsedLicenses: asset.usedLicenses ?? 0,
            configuration: asset.configuration || "",
            manufacturerVendor: asset.manufacturerVendor || "",
            assetValue: asset.assetValue ?? 0,
            lastAuditDate: formatDateForSP(asset.lastAuditDate),
            modelNumber: asset.modelNumber || "",
            serialNumber: asset.serialNumber || "",
            macAddress: asset.macAddress || "",
            configurationDetails: asset.configurationDetails || "",
            ipAddress: asset.ipAddress || "",
            maintenanceHistory: JSON.stringify(asset.maintenanceHistory || []),
            softwareName: asset.softwareName || "",
            licenseKey: asset.licenseKey || "",
            numberOfLicenses: asset.numberOfLicenses ?? 0,
            licenseOwner: asset.licenseOwner || "",
            complianceStatus: asset.complianceStatus || null,
            expiryDate: formatDateForSP(asset.expiryDate),
            Email: asset.email || "",
            emailType: asset.emailType || null,
            RequestHistory: asset.requestHistory || "",
            PrivacySettings: asset.privacySettings || "",
            Condition: asset.condition || "",
            assetRepoId: assetRepoId,
            assignToUserId: assignToUserIds,
            LicenseType: asset.variantType || asset.licenseType || ""
        };

        await sp.web.lists.getByTitle("AssetManagementSystem").items.getById(id).update(updateData);

        return {
            ...asset,
            modified: new Date().toISOString()
        };
    } catch (e) {
        console.error("Error in updateAsset:", e);
        throw e;
    }
};

export const deleteAsset = async (assetId: string): Promise<void> => {
    if (!sp) throw new Error("SPService not initialized");
    const id = parseInt(assetId);
    if (!isNaN(id)) {
        await sp.web.lists.getByTitle("AssetManagementSystem").items.getById(id).delete();
    }
};





export const getAssets = async (): Promise<Asset[]> => {
    if (!sp) return [];
    try {
        // Fetch Assets with expanded User and Repo details
        // const items = await sp.web.lists.getByTitle("AssetManagementSystem").items.select(
        //     "*",
        //     "assignToUser/Title", "assignToUser/Id", "assignToUser/JobTitle", "assignToUser/Department",
        //     "assetRepo/Title", "assetRepo/Id"
        // ).expand("assignToUser", "assetRepo")();

        const items = await sp.web.lists
            .getByTitle("AssetManagementSystem")
            .items.select(
                "Id",
                "Title",
                "AssetId",
                "Email",
                "licenseKey",
                "Status",
                "AssetType",
                "LicenseType",
                "purchaseDate",
                "expiryDate",
                "Cost",
                "modelNumber",
                "serialNumber",
                "macAddress",
                "configurationDetails",
                "ipAddress",
                "softwareName",
                "licenseKey",
                "numberOfLicenses",
                "licenseOwner",
                "complianceStatus",
                "Topic",
                "Country",
                "EndDate",
                "StartDate",
                "GeographicalArea",
                "ProjectType",
                "TotalLicenses",
                "UsedLicenses",
                "configuration",
                "manufacturerVendor",
                "assetValue",
                "Email",
                "emailType",
                "RequestHistory",
                "PrivacySettings",
                "Condition",
                "Created",
                "Modified",
                "assetRepo/Id",
                "assetRepo/Title",
                "assetRepo/cost",
                "assignToUser/ID",
                "maintenanceHistory",
                // "assignToUser/FullName",
                "assignToUser/FirstName",

            )

            .expand("assetRepo", "assignToUser").top(1000)();
        console.log(items);
        return items.map(item => {
            const familyId = item.assetRepo ? String(item.assetRepo.Id) : "";
            // Use AssetType from item if available, otherwise fallback to repo
            const isHardware = item.AssetType === "Hardware" || item.assetRepo?.AssetType === "Hardware";
            const type = isHardware ? AssetType.HARDWARE : AssetType.LICENSE;

            let assignedUser: User | null = null;
            let assignedUsers: User[] = [];

            if (item.assignToUser) {
                if (Array.isArray(item.assignToUser)) {
                    assignedUsers = item.assignToUser.map((u: any) => mapToUser(u));
                    assignedUser = assignedUsers.length > 0 ? assignedUsers[0] : null;
                } else {
                    assignedUser = mapToUser(item.assignToUser);
                    assignedUsers = [assignedUser];
                }
            }

            return {
                id: String(item.ID),
                assetId: getSafeString(item.AssetId) || getSafeString(item.Title) || String(item.ID),
                familyId: familyId,
                title: getSafeString(item.Title),
                status: (item.Status as AssetStatus) || AssetStatus.AVAILABLE,
                purchaseDate: getSafeDate(item.PurchaseDate),
                cost: getSafeNumber(item.Cost),
                activeUsers: assignedUsers,
                created: getSafeDate(item.Created),
                modified: getSafeDate(item.Modified),
                createdBy: "System",
                modifiedBy: "System",
                assetType: type,

                // Hardware specific
                serialNumber: getSafeString(item.SerialNumber),
                modelNumber: getSafeString(item.ModelNumber),
                macAddress: getSafeString(item.MacAddress),
                location: getSafeString(item.Location) || 'Office',
                condition: (item.Condition as HardwareCondition) || HardwareCondition.GOOD,
                warrantyExpiryDate: item.WarrantyExpiryDate,

                // Software specific
                licenseKey: getSafeString(item.LicenseKey),
                variantType: getSafeString(item.LicenseType) || 'Standard',
                renewalDate: item.ExpiryDate,

                assignedUser: assignedUser,
                assignedUsers: assignedUsers,
                email: getSafeString(item.Email),
                emailType: getSafeString(item.emailType),
                topic: item.Topic,
                country: getSafeString(item.Country),
                endDate: item.EndDate,
                startDate: item.StartDate,
                geographicalArea: getSafeString(item.GeographicalArea),
                projectType: getSafeString(item.ProjectType),
                totalLicenses: getSafeNumber(item.TotalLicenses),
                usedLicenses: getSafeNumber(item.UsedLicenses),
                configurationDetails: getSafeString(item.configurationDetails),
                softwareName: getSafeString(item.softwareName),
                numberOfLicenses: getSafeNumber(item.numberOfLicenses),
                licenseOwner: getSafeString(item.licenseOwner),
                requestHistory: getSafeString(item.RequestHistory),
                privacySettings: getSafeString(item.PrivacySettings),
                maintenanceHistory: safeJsonParse(item.maintenanceHistory || item.MaintenanceHistory || item.Maintenance_x0020_History, []),
                assignmentHistory: [] // History placeholder
            } as Asset;
        });
    } catch (e) {
        console.error("Error fetching assets", e);
        return [];
    }
};



export const getUsers = async (): Promise<User[]> => {
    if (!sp) return [];
    try {
        const items = await sp.web.lists.getByTitle("Contacts").items.select("*", "AttachmentFiles").expand("AttachmentFiles").top(500)();
        console.log("Fetched Users with Attachments:", items);
        return items.map(item => mapToUser(item));
    } catch (e) {
        console.error("Error fetching users", e);
        return [];
    }
};

export const addUser = async (user: User): Promise<User> => {
    if (!sp) throw new Error("SPService not initialized");
    try {
        const payload: any = {
            FullName: user.fullName,
            FirstName: user.firstName,
            Title: user.lastName,
            Suffix: user.suffix,
            Email: user.email,
            JobTitle: user.jobTitle,
            Department: user.department,
            Company: user.organization,
            WorkPhone: user.businessPhone,
            CellPhone: user.mobileNo,
            WorkAddress: user.address,
            WorkCity: user.city,
            WorkZip: user.postalCode,
            Date_x0020_Of_x0020_Joining: user.dateOfJoining,
            User_x0020_Type: user.userType === 'Internal User' ? 'Internal' : 'External',
            DateOfExit: user.dateOfExit,
            Comments: user.notes,
            Site: user.site || [],
            HomePhone: user.homePhone,
            Skype: user.skype,
            NonPersonalEmail: user.nonPersonalEmail
        };

        if (user.avatarUrl) {
            payload.Item_x0020_Cover = {
                Url: user.avatarUrl,
                Description: user.fullName
            };
        }

        if (user.linkedin) payload.LinkedIn = { Url: user.linkedin.startsWith('http') ? user.linkedin : `https://linkedin.com/in/${user.linkedin}` };
        if (user.twitter) payload.Twitter = { Url: user.twitter.startsWith('http') ? user.twitter : `https://twitter.com/${user.twitter.startsWith('@') ? user.twitter.substring(1) : user.twitter}` };
        if (user.facebook) payload.Facebook = { Url: user.facebook.startsWith('http') ? user.facebook : `https://facebook.com/${user.facebook}` };
        if (user.instagram) payload.Instagram = { Url: user.instagram.startsWith('http') ? user.instagram : `https://instagram.com/${user.instagram}` };

        const result = await sp.web.lists.getByTitle("Contacts").items.add(payload);
        return mapToUser(result.data || result);
    } catch (e) {
        console.error("Error adding user", e);
        throw e;
    }
};

export const updateUser = async (user: User): Promise<void> => {
    if (!sp) throw new Error("SPService not initialized");
    try {
        const payload: any = {
            FullName: user.fullName,
            FirstName: user.firstName,
            Title: user.lastName,
            Suffix: user.suffix,
            Email: user.email,
            JobTitle: user.jobTitle,
            Department: user.department,
            Company: user.organization,
            WorkPhone: user.businessPhone,
            CellPhone: user.mobileNo,
            WorkAddress: user.address,
            WorkCity: user.city,
            WorkZip: user.postalCode,
            Date_x0020_Of_x0020_Joining: user.dateOfJoining,
            User_x0020_Type: user.userType === 'Internal User' ? 'Internal' : 'External',
            DateOfExit: user.dateOfExit,
            Comments: user.notes,
            Site: user.site || [],
            HomePhone: user.homePhone,
            Skype: user.skype,
            NonPersonalEmail: user.nonPersonalEmail,
            History: JSON.stringify(user.history || [])
        };

        if (user.avatarUrl) {
            payload.Item_x0020_Cover = {
                Url: user.avatarUrl,
                Description: user.fullName
            };
        }

        if (user.linkedin) payload.LinkedIn = { Url: user.linkedin.startsWith('http') ? user.linkedin : `https://linkedin.com/in/${user.linkedin}` };
        if (user.twitter) payload.Twitter = { Url: user.twitter.startsWith('http') ? user.twitter : `https://twitter.com/${user.twitter.startsWith('@') ? user.twitter.substring(1) : user.twitter}` };
        if (user.facebook) payload.Facebook = { Url: user.facebook.startsWith('http') ? user.facebook : `https://facebook.com/${user.facebook}` };
        if (user.instagram) payload.Instagram = { Url: user.instagram.startsWith('http') ? user.instagram : `https://instagram.com/${user.instagram}` };

        await sp.web.lists.getByTitle("Contacts").items.getById(parseInt(user.id as string)).update(payload);
    } catch (e) {
        console.error("Error updating user", e);
        throw e;
    }
};

export const deleteUser = async (userId: string): Promise<void> => {
    if (!sp) throw new Error("SPService not initialized");
    try {
        await sp.web.lists.getByTitle("Contacts").items.getById(parseInt(userId)).delete();
    } catch (e) {
        console.error("Error deleting user", e);
        throw e;
    }
};

export const getRequests = async (): Promise<Request[]> => {
    if (!sp) return [];
    try {
        const items = await sp.web.lists.getByTitle("Request").items.select(
            "*",
            "RequestedBy/Title", "RequestedBy/Id"
        ).expand("RequestedBy").top(5000)();

        return items.map(item => {
            const requester = item.RequestedBy ? mapToUser(item.RequestedBy) : mapToUser({ Title: "Unknown", Email: "", Id: 0 });

            return {
                id: String(item.ID),
                type: item.RequestType,
                item: getSafeString(item.Title),
                requestedBy: requester,
                status: (item.Status as RequestStatus) || RequestStatus.PENDING,
                requestDate: getSafeDate(item.RequestDate || item.Created),
                notes: getSafeString(item.Comment),
                familyId: "",
                assetId: ""
            };
        });
    } catch (e) {
        console.error("Error fetching requests", e);
        return [];
    }
};

export const addRequest = async (family: AssetFamily, user: User, notes: string): Promise<Request> => {
    if (!sp) throw new Error("SPService not initialized");
    try {
        const familyIdNum = parseInt(family.id.replace('repo-', ''));
        const payload = {
            Title: family.name,
            RequestType: family.assetType === AssetType.HARDWARE ? 'Hardware' : 'Software',
            Status: "Pending",
            Comment: notes,
            RequestDate: new Date().toISOString(),
            AssetFamilyId: isNaN(familyIdNum) ? null : familyIdNum,
            RequestedById: parseInt(user.id as string) || null
        };

        const result = await sp.web.lists.getByTitle("Request").items.add(payload);
        const item = result.data || result; // Handle both PnP return styles

        return {
            id: String(item.ID),
            type: family.assetType === AssetType.HARDWARE ? 'Hardware' : 'Software',
            item: family.name,
            requestedBy: user,
            status: RequestStatus.PENDING,
            requestDate: getSafeDate(item.RequestDate || item.Created),
            notes: notes,
            familyId: family.id,
            assetId: ""
        };
    } catch (e) {
        console.error("Error submitting request to SharePoint:", e);
        throw e;
    }
};

export const updateRequest = async (requestId: string, newStatus: RequestStatus): Promise<void> => {
    if (!sp) throw new Error("SPService not initialized");
    try {
        // Expect format 'req-123' or just '123'
        const spRequestId = parseInt(requestId.replace('req-', ''));

        if (isNaN(spRequestId)) {
            throw new Error("Invalid Request ID");
        }

        await sp.web.lists.getByTitle("Request").items.getById(spRequestId).update({
            Status: newStatus
        });

    } catch (e) {
        console.error("Error processing request action:", e);
        throw e;
    }
};


export const handleImageUpload = async (file: File, folder: string) => {
    // Ensure context is available
    if (!_context) throw new Error("SPService not initialized with context");

    const res = getTargetWeb("https://smalsusinfolabs.sharepoint.com/sites/HHHHQA/AI");
    try {
        const library = await res.lists.getByTitle("Images").expand("RootFolder").select("RootFolder/ServerRelativeUrl")();
        const rootPath = library.RootFolder.ServerRelativeUrl;
        const folderPath = `${rootPath}/${folder}`;

        const fileName = `${Date.now()}_${file.name}`;
        console.log(`Uploading ${fileName} to ${folderPath}`);

        // Use addChunked for best reliability
        const result: any = await res.getFolderByServerRelativePath(folderPath).files.addChunked(fileName, file, { Overwrite: true });
        const relativeUrl = result.data?.ServerRelativeUrl || result.ServerRelativeUrl;
        const fullUrl = `https://smalsusinfolabs.sharepoint.com${relativeUrl}`;
        console.log("Image uploaded successfully:", fullUrl);
        return fullUrl;
    } catch (error) {
        console.error("Error uploading image to SharePoint:", error);
        throw error;
    }
};

// Also export as strict uploadImage signature to satisfy previous consumers
export const uploadImage = async (file: File, libraryName: string = "Images", folderName: string = "Logos"): Promise<string> => {
    return handleImageUpload(file, folderName);
}

export const getLibraryImages = async () => {
    // Ensure context is available
    if (!_context) {
        console.error("SPService context not initialized");
        return {};
    }

    const res = getTargetWeb("https://smalsusinfolabs.sharepoint.com/sites/HHHHQA/AI");
    try {
        const library = await res.lists.getByTitle("Images").expand("RootFolder").select("RootFolder/ServerRelativeUrl")();
        const rootPath = library.RootFolder.ServerRelativeUrl;
        console.log("Images Library Root Path:", rootPath);

        const folders = ['Logos', 'Covers', 'Images'];
        const libraryImages: Record<string, string[]> = {};

        await Promise.all(folders.map(async (folder) => {
            try {
                const folderPath = `${rootPath}/${folder}`;
                const files = await res.getFolderByServerRelativePath(folderPath).files();

                libraryImages[folder] = files.map((f: any) => `https://smalsusinfolabs.sharepoint.com${f.ServerRelativeUrl}`);
                console.log(`Fetched ${files.length} images for ${folder}`);
            } catch (e) {
                console.warn(`Could not fetch images for folder ${folder} at path ${rootPath}/${folder}:`, e);
                libraryImages[folder] = [];
            }
        }));

        return libraryImages;
    } catch (error) {
        console.error("Error fetching library images:", error);
        return {};
    }
};

export const getSmartMetadata = async (taxType: string): Promise<{ [key: string]: string[] }> => {
    try {
        const items = await sp.web.lists.getByTitle("SmartMetadata").items
            .filter(`TaxType eq '${taxType}'`)
            .select("Title", "Configurations", "TaxType")();

        const result: { [key: string]: string[] } = {};

        items.forEach((item: any) => {
            const configStr = getSafeString(item.Configurations);
            // Expected JSON: [{"id":"1","name":"Microsoft"}, ...]
            const parsedConfig: any[] = safeJsonParse(configStr, []);

            if (Array.isArray(parsedConfig)) {
                // Extract 'name' property from each object
                result[item.Title] = parsedConfig.map((c: any) => c?.name || c).filter(Boolean);
            }
        });

        return result;
    } catch (e) {
        console.error(`Error fetching SmartMetadata for ${taxType}:`, e);
        return {};
    }
};

export const updateSmartMetadata = async (taxType: string, title: string, categories: string[]): Promise<void> => {
    try {
        // Construct JSON payload: [{"id": 1, "name": "Cat1"}, ...]
        // We generate simple IDs for consistency with the screenshot style
        const jsonPayload = categories.map((cat, index) => ({
            id: index + 1,
            name: cat
        }));

        const list = sp.web.lists.getByTitle("SmartMetadata");

        // Check if item exists
        const existingItems = await list.items
            .filter(`TaxType eq '${taxType}' and Title eq '${title}'`)();

        if (existingItems.length > 0) {
            await list.items.getById(existingItems[0].Id).update({
                Configurations: JSON.stringify(jsonPayload)
            });
        } else {
            // Create new if not exists (optional fallback)
            await list.items.add({
                Title: title,
                TaxType: taxType,
                Configurations: JSON.stringify(jsonPayload)
            });
        }
    } catch (e) {
        console.error(`Error updating SmartMetadata for ${title}:`, e);
        throw e;
    }
};
