import type { Asset } from 'expo-media-library';
import { createDeleteUndoController } from './deleteUndoController';

const makeAsset = (id: string): Asset =>
  ({
  id,
  uri: `file://${id}`,
  mediaType: 'photo',
  width: 100,
  height: 100,
  creationTime: 0,
  modificationTime: 0,
  duration: 0,
  } as Asset);

describe('deleteUndoController', () => {
  it('commits delete after grace period', () => {
    const commitDelete = jest.fn();
    const controller = createDeleteUndoController({
      commitDelete,
      onStateChange: () => {},
    });

    controller.scheduleDelete(makeAsset('a'));
    expect(commitDelete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(60000);
    expect(commitDelete).toHaveBeenCalledTimes(1);
    expect(controller.getLastAction()).toBeNull();
  });

  it('undo cancels pending deletion', () => {
    const commitDelete = jest.fn();
    const controller = createDeleteUndoController({
      commitDelete,
      onStateChange: () => {},
    });

    controller.scheduleDelete(makeAsset('a'));
    const restored = controller.undoDelete();
    expect(restored?.id).toBe('a');

    jest.advanceTimersByTime(60000);
    expect(commitDelete).not.toHaveBeenCalled();
  });

  it('replaces pending delete and commits previous immediately', () => {
    const commitDelete = jest.fn();
    const controller = createDeleteUndoController({
      commitDelete,
      onStateChange: () => {},
    });

    controller.scheduleDelete(makeAsset('a'));
    controller.scheduleDelete(makeAsset('b'));

    expect(commitDelete).toHaveBeenCalledTimes(1);
    expect(commitDelete.mock.calls[0][0].id).toBe('a');
    expect(controller.getLastAction()?.asset.id).toBe('b');
  });
});
