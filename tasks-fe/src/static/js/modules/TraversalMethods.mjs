function child_with_class(target, className) {
    for (let i in target.children) {
        let child = target.children.item(i);
        if (child.classList.contains(className)) {
            return child;
        }
    }
}

function parent_with_class(target, className) {
    if (target.parentElement.classList.contains(className)) {
        return target.parentElement;
    }
}

function next_sibling_with_class(target, className) {
    if (target.nextElementSibling.classList.contains(className)) {
        return target.nextElementSibling;
    }
}

export {child_with_class, parent_with_class, next_sibling_with_class}