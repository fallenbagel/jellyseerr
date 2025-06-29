class AutoApprovalSpecificationBase {
  public implementationName: string;
  public comparator: string;
  public value: unknown;
  public badgeText: string;

  isSatisfiedBy(): boolean {
    return false;
  }
}

export default AutoApprovalSpecificationBase;
