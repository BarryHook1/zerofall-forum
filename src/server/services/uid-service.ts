type UidSequenceRecord = {
  currentValue: number;
};

type UidSequenceRepository = {
  getForumSequence(): Promise<UidSequenceRecord>;
  updateForumSequence(nextValue: number): Promise<void>;
};

type PurchaseRecord = {
  status: "pending" | "paid" | "failed" | "refunded" | "canceled";
};

type UserRecord = {
  forumUid: number | null;
};

type AssignUidParams = {
  purchase: PurchaseRecord;
  user: UserRecord;
};

export class UidService {
  constructor(private readonly repository: UidSequenceRepository) {}

  async issueNextUid({ purchase, user }: AssignUidParams) {
    if (purchase.status !== "paid") {
      throw new Error("UID can only be issued after a paid entry purchase");
    }

    if (user.forumUid) {
      return user.forumUid;
    }

    const sequence = await this.repository.getForumSequence();
    const nextValue = sequence.currentValue + 1;

    await this.repository.updateForumSequence(nextValue);

    return nextValue;
  }
}
