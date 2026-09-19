/**
 * Compatibility shim: tag UI moved to features/tag.
 * Import from "features/tag" instead. Removed once no call site uses this.
 */
export { CreateTagModal, DeleteTagModal } from "../../features/tag";
export type { CreateTagModalProps, DeleteTagModalProps } from "../../features/tag";
