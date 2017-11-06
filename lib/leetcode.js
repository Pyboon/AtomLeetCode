'use babel';

import LeetcodeSearchView from './leetcode-search-view';
import LeetcodeResultView from './leetcode-result-view';
import LeetcodeSubmitView from './leetcode-submit-view';
import {
    CompositeDisposable
} from 'atom';

export default {
    subscriptions: null,

    activate() {
        this.subscriptions = new CompositeDisposable();
        this.leetcodeResultView = new LeetcodeResultView();
        this.leetcodeSearchView = new LeetcodeSearchView(this.leetcodeResultView);
        this.leetcodeSubmitView = new LeetcodeSubmitView();
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'leetcode:easy': () => this.leetcodeResultView.getProblem(1, null),
            'leetcode:medium': () => this.leetcodeResultView.getProblem(2, null),
            'leetcode:hard': () => this.leetcodeResultView.getProblem(3, null),
            'leetcode:solutions': () => this.leetcodeResultView.getSolutions(),
            'leetcode:search': () => this.leetcodeSearchView.toggle(),
            'leetcode:submit': () => this.leetcodeSubmitView.submitSolution(),
        }));
    },

    serialize() {},

    deactivate() {
        this.subscriptions.dispose();
        this.leetcodeSearchView.destroy();
        this.leetcodeResultView.destroy();
        this.leetcodeSubmitView.destroy();
        this.leetcodeTestView.destroy();
    },
};
