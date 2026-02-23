export type KeyStatus = "active" | "expired" | "deleted" | "banned";
export type KeyDurationType = "minutes" | "days" | "permanent";

export interface IKey {
  _id: string;
  key: string;
  status: KeyStatus;
  durationType: KeyDurationType;
  durationValue?: number;
  createdAt: Date;
  expiresAt?: Date;
  deletedAt?: Date;         // when it expired/was deleted (starts 30d TTL)
  robloxNick?: string;
  hwid?: string;
  ip?: string;
  note?: string;
  usageCount: number;
  lastUsedAt?: Date;
}

export interface ILog {
  _id: string;
  type: "execution" | "create" | "delete" | "restore" | "invalid_attempt" | "blocked_attempt" | "admin_action";
  key?: string;
  robloxNick?: string;
  hwid?: string;
  ip?: string;
  timestamp: Date;
  message?: string;
  adminIp?: string;
}

export interface IBlacklist {
  _id: string;
  type: "hwid" | "ip" | "robloxNick";
  value: string;
  reason?: string;
  createdAt: Date;
}

export interface IAudit {
  _id: string;
  action: string;
  detail?: string;
  adminIp: string;
  timestamp: Date;
}

export interface IKeyUsage {
  _id: string;
  key: string;
  hwid?: string;
  ip?: string;
  robloxNick?: string;
  timestamp: Date;
}
