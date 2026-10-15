import React from "react";
import type { SuperDataGridAuditPerson } from "../../types";
import styles from "../../styles/common-cells.module.css";
import CreatedByCell from "./CreatedByCell";
import UserContactCell from "./UserContactCell";

interface PeopleAuditPairCellProps {
  value: unknown;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function readText(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readPerson(value: unknown): SuperDataGridAuditPerson {
  const record = toRecord(value);
  if (!record) return {};

  const createdAt = record.createdAt;
  return {
    name: readText(record, "name"),
    firstName: readText(record, "firstName"),
    lastName: readText(record, "lastName"),
    email: readText(record, "email") ?? readText(record, "loginName"),
    loginName: readText(record, "loginName"),
    createdAt:
      typeof createdAt === "string" || createdAt instanceof Date
        ? createdAt
        : null,
  };
}

export default function PeopleAuditPairCell({ value }: Readonly<PeopleAuditPairCellProps>) {
  const pair = toRecord(value);
  const assignedTo = readPerson(pair?.assignedTo);
  const createdBy = readPerson(pair?.createdBy);

  return (
    <div className={styles.peopleAuditPair} data-test-id="people-audit-pair-cell">
      <div className={styles.peopleAuditPairSide}>
        <UserContactCell
          name={assignedTo.name}
          firstName={assignedTo.firstName}
          lastName={assignedTo.lastName}
          email={assignedTo.email}
          label="Assigned To"
          showPhone={false}
          showEmptyFields
          testId="people-audit-pair-assigned-to"
        />
      </div>
      <div className={`${styles.peopleAuditPairSide} ${styles.peopleAuditPairSideTrailing}`}>
        <CreatedByCell
          name={createdBy.name}
          firstName={createdBy.firstName}
          lastName={createdBy.lastName}
          email={createdBy.email}
          label="Created By"
          created={createdBy.createdAt}
          showEmptyFields
          testId="people-audit-pair-created-by"
        />
      </div>
    </div>
  );
}
