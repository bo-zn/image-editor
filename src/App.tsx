import Cropper from './components/cropper';
import Fabric from './components/fabric';
import { defineComponent } from 'vue';

export default defineComponent({
  setup() {
    return () => (
      <div id="app">
        {/* <Cropper /> */}
        <Fabric />
      </div>
    );
  }
});