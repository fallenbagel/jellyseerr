import AutoApprovalSpecificationBase from './AutoApprovalSpecificationBase';

class UserSpecification extends AutoApprovalSpecificationBase {
  public implementationName = 'user';
  public isSatisfiedBy(): boolean {
    return false;
  }
  public value: string;
  public comparator: string;
  public badgeText: string;
  public constructor(comparator?: string, value?: string) {
    super();
    this.comparator = comparator ?? 'is';
    this.value = value ?? '';
    this.badgeText = this.generateBadgeText();
  }

  private generateBadgeText(): string {
    let usersString = '';
    const loadUsers = async (): Promise<void> => {
      if (!this.value) {
        return;
      }

      const users = this.value.split(',');

      users
        .filter((u) => response.results.find((user) => user.id == Number(u)))
        .map((u) => response.results.find((user) => user.id == Number(u)))
        .map((u) => (usersString += u?.displayName ?? ''));
    };

    loadUsers();
    return `User ${this.comparator} ${usersString}`;
  }
}

export default UserSpecification;
