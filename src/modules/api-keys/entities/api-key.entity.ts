import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../auth/entities/auth.entity";

@Entity("api_keys")
export class ApiKey {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "user_id" })
  user_id: string;

  @Column({ name: "key_hash" })
  key_hash: string;

  @Column()
  name: string;

  @Column({ type: "simple-array" })
  permissions: string[];

  @Column({ type: "timestamp", name: "expires_at" })
  expires_at: Date;

  @Column({ default: false })
  revoked: boolean;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.api_keys)
  @JoinColumn({ name: "user_id" })
  user: User;
}
