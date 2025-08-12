/**
 * 实体基类
 * 所有领域实体都应继承此类
 */

export abstract class Entity<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = props;
  }

  /**
   * 比较两个实体是否相等
   * 实体相等是通过ID来定义的，而不是通过属性
   */
  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    // 简单实现，实际项目中可能需要更复杂的ID比较逻辑
    return this.getId() === entity.getId();
  }

  /**
   * 获取实体ID
   * 子类必须实现此方法
   */
  abstract getId(): any;
}
