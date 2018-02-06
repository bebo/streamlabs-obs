import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { SceneCollectionsService } from 'services/scene-collections';
import { Inject } from 'util/injector';
import moment from 'moment';

@Component({})
export default class EditableSceneCollection extends Vue {
  @Inject() sceneCollectionsService: SceneCollectionsService;
  @Prop() collectionId: string;
  @Prop() selected: boolean;

  renaming = false;
  editableName = '';
  duplicating = false;

  $refs: {
    rename: HTMLInputElement;
  };

  get collection() {
    return this.sceneCollectionsService.collections.find(coll => coll.id === this.collectionId);
  }

  get modified() {
    return moment(this.collection.modified).fromNow();
  }

  get isActive() {
    return this.collection.id === this.sceneCollectionsService.activeCollection.id;
  }

  handleKeypress(e: KeyboardEvent) {
    if (e.code === 'Enter') this.submitRename();
  }

  makeActive() {
    this.sceneCollectionsService.load(this.collection.id);
  }

  duplicate() {
    this.duplicating = true;

    setTimeout(() => {
      this.sceneCollectionsService.duplicate(this.collection.name, this.collection.id).then(() => {
        this.duplicating = false;
      }).catch(() => {
        this.duplicating = false;
      });
    }, 500);
  }

  startRenaming() {
    this.renaming = true;
    this.editableName = this.collection.name;
    this.$nextTick(() => this.$refs.rename.focus());
  }

  submitRename() {
    this.sceneCollectionsService.rename(this.editableName, this.collectionId);
    this.renaming = false;
  }

  cancelRename() {
    this.renaming = false;
  }

  remove() {
    if (!confirm(`Are you sure you want to remove ${this.collection.name}?`)) return;
    this.sceneCollectionsService.delete(this.collectionId);
  }

}
